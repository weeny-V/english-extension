import { Client } from "@notionhq/client"
import { GoogleGenAI } from "@google/genai"

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_WORD') {
    handleSaveWord(message.word, message.translation).then(sendResponse)
    return true
  }
  if (message.type === 'TEST_CONNECTION') {
    testConnection(message.token, message.databaseId).then(sendResponse)
    return true
  }
  if (message.type === 'TRANSLATE_TEXT') {
    handleTranslate(message.text).then(sendResponse)
    return true
  }
})

async function handleTranslate(text) {
  try {
    const { geminiApiKey, sourceLang, targetLang } = await chrome.storage.sync.get([
      'geminiApiKey',
      'sourceLang',
      'targetLang',
    ])
    console.log(geminiApiKey, sourceLang, targetLang)

    if (!geminiApiKey) {
      return { success: false, error: 'Please configure your Gemini API key in the extension popup' }
    }

    const source = sourceLang || 'English'
    const target = targetLang || 'Ukrainian'

    const ai = new GoogleGenAI({ apiKey: geminiApiKey })
    const prompt = `You are a professional translator. Translate the text from ${source} to ${target}. Maintain technical terms and emotional nuances. Return only the translated text without comments. Text: ${text}`

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
    })

    const translation = response.text.trim()
    return { success: true, translation }
  } catch (err) {
    console.log(err)
    return { success: false, error: err.message }
  }
}

function getTodayDate() {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, '0')
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  return `${day}/${month}/${year}`
}

async function handleSaveWord(word, translation) {
  try {
    const { notionToken, notionDatabaseId } = await chrome.storage.sync.get([
      'notionToken',
      'notionDatabaseId',
    ])

    if (!notionToken || !notionDatabaseId) {
      return {
        success: false,
        error: 'Please configure Notion settings in the extension popup first',
      }
    }

    // If no translation was provided, try to translate now
    let translatedText = translation
    if (!translatedText) {
      const translateResult = await handleTranslate(word)
      if (translateResult.success) {
        translatedText = translateResult.translation
      }
    }

    const [isPageFound, pageId] = await findPage(notionToken, notionDatabaseId)
    console.log(isPageFound, pageId)

    if (isPageFound && pageId) {
      await appendWord(notionToken, pageId, word, translatedText)
    } else {
      await createPage(notionToken, notionDatabaseId, word, translatedText)
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function testConnection(token, databaseId) {
  const notion = new Client({ auth: token })

  try {
    const response = await notion.blocks.retrieve({
      block_id: databaseId
    })

    if (response.status === 400) {
      return { success: false, error: response.message || `Error ${response.status}` }
    }

    const name = response.child_page.title
    console.log(name)

    return { success: true, databaseName: name }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

async function findPage(token, page_id) {
  const todayDate = getTodayDate()
  let isPageFound = false
  let pageId = null

  try {
    const notion = new Client({ auth: token })

    const responseChildPages = await notion.blocks.children.list({
      block_id: page_id
    })
    const childPages = responseChildPages.results
    console.log(childPages)

    childPages.forEach(page => {
      console.log(page, todayDate)
      if (page?.child_page?.title === todayDate) {
        isPageFound = true
        pageId = page.id
      }
    })

    return [isPageFound, pageId]
  } catch(err) {
    return [false, null]
  }
}

function buildWordBlocks(word, translation) {
  const blocks = [
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: { content: word },
            annotations: { bold: true },
          },
          ...(translation
            ? [
                {
                  type: 'text',
                  text: { content: ' — ' },
                },
                {
                  type: 'text',
                  text: { content: translation },
                  annotations: { italic: true, color: 'gray' },
                },
              ]
            : []),
        ],
      },
    },
  ]
  return blocks
}

async function createPage(token, page_id, word, translation) {
  const notion = new Client({ auth: token })
  const todayDate = getTodayDate()

  try {
    await notion.pages.create({
      parent: {
        page_id
      },
      properties: {
        title: {
          title: [{ text: { content: todayDate } }],
        }
      },
      children: buildWordBlocks(word, translation),
    })
  } catch(err) {
    console.log(err)
  }
}

async function appendWord(token, pageId, word, translation) {
  const notion = new Client({ auth: token })

  await notion.blocks.children.append({
    block_id: pageId,
    children: buildWordBlocks(word, translation),
  });
}
