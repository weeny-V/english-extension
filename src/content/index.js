export default function () {
  if (window.__nwsLoaded) return
  window.__nwsLoaded = true

  let saveBtn = null
  let translateTooltip = null
  let selectedText = ''
  let currentTranslation = ''
  let isSaving = false
  let isTranslating = false
  let translateTimeout = null

  function init() {
    // ── Save Button ──
    saveBtn = document.createElement('div')
    saveBtn.id = 'nws-btn'
    saveBtn.innerHTML = `
      <span class="nws-icon">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
        </svg>
      </span>
      <span class="nws-label">Save to Notion</span>
    `
    saveBtn.style.display = 'none'
    document.documentElement.appendChild(saveBtn)

    saveBtn.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault() })
    saveBtn.addEventListener('click', (e) => { e.stopPropagation(); e.preventDefault(); handleSave() })

    // ── Translation Tooltip ──
    translateTooltip = document.createElement('div')
    translateTooltip.id = 'nws-translate-tooltip'
    translateTooltip.innerHTML = `
      <div class="nws-tt-header">
        <span class="nws-tt-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m5 8 6 6"/>
            <path d="m4 14 6-6 2-3"/>
            <path d="M2 5h12"/>
            <path d="M7 2h1"/>
            <path d="m22 22-5-10-5 10"/>
            <path d="M14 18h6"/>
          </svg>
          Translation
        </span>
        <button class="nws-tt-close" title="Close">✕</button>
      </div>
      <div class="nws-tt-body">
        <div class="nws-tt-loading">
          <div class="nws-tt-shimmer"></div>
          <div class="nws-tt-shimmer nws-tt-shimmer--short"></div>
        </div>
        <div class="nws-tt-result" style="display:none"></div>
        <div class="nws-tt-error" style="display:none"></div>
      </div>
    `
    translateTooltip.style.display = 'none'
    document.documentElement.appendChild(translateTooltip)

    translateTooltip.addEventListener('mousedown', (e) => { e.stopPropagation(); e.preventDefault() })
    translateTooltip.querySelector('.nws-tt-close').addEventListener('click', (e) => {
      e.stopPropagation()
      e.preventDefault()
      hideTranslateTooltip()
    })

    document.addEventListener('mouseup', onMouseUp, true)
    document.addEventListener('mousedown', onMouseDown, true)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        hideBtn()
        hideTranslateTooltip()
      }
    }, true)
  }

  function onMouseUp(e) {
    if (saveBtn && saveBtn.contains(e.target)) return
    if (translateTooltip && translateTooltip.contains(e.target)) return
    setTimeout(() => {
      const sel = window.getSelection()
      const text = sel?.toString().trim()
      if (text && text.length > 0) {
        selectedText = text
        currentTranslation = ''
        const rect = sel.getRangeAt(0).getBoundingClientRect()
        showBtn(rect)
        showTranslateTooltip(rect, text)
      }
    }, 10)
  }

  function onMouseDown(e) {
    if (saveBtn && saveBtn.contains(e.target)) { e.preventDefault(); return }
    if (translateTooltip && translateTooltip.contains(e.target)) { e.preventDefault(); return }
    hideBtn()
    hideTranslateTooltip()
  }

  function showBtn(rect) {
    const x = rect.left + rect.width / 2
    const y = rect.top - 10
    saveBtn.style.cssText = `display:flex; left:${x}px; top:${y}px; transform:translate(-50%,-100%);`
    saveBtn.classList.remove('nws-loading', 'nws-success', 'nws-error')
    saveBtn.querySelector('.nws-label').textContent = 'Save to Notion'
  }

  function hideBtn() {
    if (saveBtn) saveBtn.style.display = 'none'
  }

  // ── Translation Tooltip ──
  function showTranslateTooltip(rect, text) {
    if (isTranslating) return
    if (translateTimeout) { clearTimeout(translateTimeout); translateTimeout = null }

    const loading = translateTooltip.querySelector('.nws-tt-loading')
    const result = translateTooltip.querySelector('.nws-tt-result')
    const error = translateTooltip.querySelector('.nws-tt-error')

    loading.style.display = 'block'
    result.style.display = 'none'
    error.style.display = 'none'
    result.textContent = ''
    error.textContent = ''

    const x = rect.left + rect.width / 2
    const y = rect.bottom + 10
    translateTooltip.style.cssText = `display:block; left:${x}px; top:${y}px; transform:translate(-50%, 0);`
    translateTooltip.classList.remove('nws-tt--visible')
    requestAnimationFrame(() => translateTooltip.classList.add('nws-tt--visible'))

    requestTranslation(text)
  }

  function hideTranslateTooltip() {
    if (translateTooltip) {
      translateTooltip.classList.remove('nws-tt--visible')
      setTimeout(() => { translateTooltip.style.display = 'none' }, 200)
    }
    if (translateTimeout) { clearTimeout(translateTimeout); translateTimeout = null }
  }

  async function requestTranslation(text) {
    isTranslating = true
    const loading = translateTooltip.querySelector('.nws-tt-loading')
    const result = translateTooltip.querySelector('.nws-tt-result')
    const error = translateTooltip.querySelector('.nws-tt-error')

    try {
      const res = await chrome.runtime.sendMessage({ type: 'TRANSLATE_TEXT', text })

      if (res?.success) {
        loading.style.display = 'none'
        result.style.display = 'block'
        result.textContent = res.translation
        currentTranslation = res.translation

        translateTimeout = setTimeout(() => hideTranslateTooltip(), 12000)
      } else {
        loading.style.display = 'none'
        error.style.display = 'block'
        error.textContent = res?.error || 'Translation failed'

        translateTimeout = setTimeout(() => hideTranslateTooltip(), 5000)
      }
    } catch (err) {
      loading.style.display = 'none'
      error.style.display = 'block'
      error.textContent = 'Extension error: ' + err.message

      translateTimeout = setTimeout(() => hideTranslateTooltip(), 5000)
    } finally {
      isTranslating = false
    }
  }

  // ── Save to Notion ──
  async function handleSave() {
    if (!selectedText || isSaving) return
    isSaving = true
    const label = saveBtn.querySelector('.nws-label')
    saveBtn.classList.add('nws-loading')
    label.textContent = 'Saving…'

    try {
      const res = await chrome.runtime.sendMessage({ type: 'SAVE_WORD', word: selectedText, translation: currentTranslation })
      if (res?.success) {
        saveBtn.classList.replace('nws-loading', 'nws-success')
        label.textContent = 'Saved ✓'
        showToast(`"${selectedText}" saved!`, 'success')
        setTimeout(() => { hideBtn(); isSaving = false }, 1500)
      } else {
        saveBtn.classList.replace('nws-loading', 'nws-error')
        label.textContent = 'Error!'
        showToast(res?.error || 'Failed to save', 'error')
        setTimeout(() => { hideBtn(); isSaving = false }, 2500)
      }
    } catch (err) {
      saveBtn.classList.replace('nws-loading', 'nws-error')
      label.textContent = 'Error!'
      showToast('Extension error: ' + err.message, 'error')
      setTimeout(() => { hideBtn(); isSaving = false }, 2500)
    }
  }

  // ── Toasts ──
  let toastWrap = null
  function showToast(msg, type) {
    if (!toastWrap) {
      toastWrap = document.createElement('div')
      toastWrap.id = 'nws-toasts'
      document.documentElement.appendChild(toastWrap)
    }
    const t = document.createElement('div')
    t.className = `nws-toast nws-toast--${type}`
    t.textContent = msg
    toastWrap.appendChild(t)
    requestAnimationFrame(() => t.classList.add('nws-toast--show'))
    setTimeout(() => {
      t.classList.remove('nws-toast--show')
      t.addEventListener('transitionend', () => t.remove(), { once: true })
    }, 3000)
  }

  init()
}
