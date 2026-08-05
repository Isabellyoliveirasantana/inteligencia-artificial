/* script.js — Lógica de arrastar/soltar e gerenciamento de informações das palavras */

const WORDS = [
  {id: 'w1', text: 'Inteligência', info: 'Processo de criar sistemas que aprendem e tomam decisões.'},
  {id: 'w2', text: 'Artificial', info: 'Refere-se a algo criado pelo homem, não natural.'},
  {id: 'w3', text: 'Aprendizado', info: 'Técnicas que permitem que sistemas melhorem com dados.'},
  {id: 'w4', text: 'Máquina', info: 'Computadores ou sistemas que executam tarefas automatizadas.'},
  {id: 'w5', text: 'Dados', info: 'Informações usadas para treinar modelos e tomar decisões.'},
  {id: 'w6', text: 'Visão', info: 'Área que permite que máquinas "vejam" e interpretem imagens.'},
  {id: 'w7', text: 'NLP', info: 'Processamento de Linguagem Natural — trabalhar com texto e fala.'}
]

// Estado simples em memória
let words = JSON.parse(JSON.stringify(WORDS))
let selectedWordId = null

// Elementos
const bankEl = document.getElementById('word-bank')
const dropzoneEl = document.getElementById('dropzone')
const sentenceEl = document.getElementById('sentence')
const infoArea = document.getElementById('info-area')
const infoForm = document.getElementById('info-form')
const wordTextInput = document.getElementById('word-text')
const wordInfoInput = document.getElementById('word-info')
const saveInfoBtn = document.getElementById('save-info')
const cancelInfoBtn = document.getElementById('cancel-info')
const clearBtn = document.getElementById('clear')
const shuffleBtn = document.getElementById('shuffle')

function renderBank(){
  bankEl.innerHTML = ''
  const inBank = words.filter(w => !document.getElementById(w.id) || document.getElementById(w.id).parentElement === bankEl)
  // Ensure we render all words that are not in dropzone
  words.forEach(w => {
    const exists = document.getElementById(w.id)
    if (!exists || exists.parentElement !== bankEl) {
      const el = createWordEl(w)
      bankEl.appendChild(el)
    }
  })
}

function createWordEl(word){
  const span = document.createElement('span')
  span.className = 'word'
  span.draggable = true
  span.id = word.id
  span.textContent = word.text
  span.setAttribute('data-info', word.info || '')

  span.addEventListener('dragstart', onDragStart)
  span.addEventListener('dragend', onDragEnd)
  span.addEventListener('click', () => selectWord(word.id))
  return span
}

function onDragStart(e){
  e.dataTransfer.setData('text/plain', e.target.id)
  e.dataTransfer.effectAllowed = 'move'
  e.target.classList.add('dragging')
}
function onDragEnd(e){
  e.target.classList.remove('dragging')
  updateSentence()
}

// Drop handling for dropzone and bank
;['dragover','dragenter'].forEach(evt => {
  dropzoneEl.addEventListener(evt, (e) => {
    e.preventDefault(); e.dataTransfer.dropEffect = 'move'
  })
  bankEl.addEventListener(evt, (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move' })
})

dropzoneEl.addEventListener('drop', (e) => {
  e.preventDefault()
  const id = e.dataTransfer.getData('text/plain')
  const dragged = document.getElementById(id)
  if (!dragged) return

  // If dropped on a specific word, insert before it
  const afterEl = getDropAfterElement(dropzoneEl, e.clientX, e.clientY)
  if (afterEl == null) dropzoneEl.appendChild(dragged)
  else dropzoneEl.insertBefore(dragged, afterEl)

  updateSentence()
})

bankEl.addEventListener('drop', (e) => {
  e.preventDefault()
  const id = e.dataTransfer.getData('text/plain')
  const dragged = document.getElementById(id)
  if (!dragged) return
  bankEl.appendChild(dragged)
  updateSentence()
})

// Helper to get element to insert before based on mouse position
function getDropAfterElement(container, x, y){
  const children = [...container.querySelectorAll('.word:not(.dragging)')]
  for (const child of children){
    const rect = child.getBoundingClientRect()
    if (y < rect.top + rect.height/2) return child
  }
  return null
}

function updateSentence(){
  const wordsInDrop = [...dropzoneEl.querySelectorAll('.word')].map(w => w.textContent)
  sentenceEl.textContent = wordsInDrop.join(' ')
}

function selectWord(id){
  selectedWordId = id
  const w = words.find(x => x.id === id) || {text: document.getElementById(id)?.textContent, info: document.getElementById(id)?.dataset?.info}
  infoArea.innerHTML = `\n    <h3>${w.text || ''}</h3>\n    <p>${w.info || '<em>Sem informações</em>'}</p>\n  `
  // populate form
  wordTextInput.value = w.text || ''
  wordInfoInput.value = w.info || ''
  infoForm.classList.remove('hidden')
}

saveInfoBtn.addEventListener('click', () => {
  if (!selectedWordId) return
  const el = document.getElementById(selectedWordId)
  if (!el) return
  el.textContent = wordTextInput.value
  el.dataset.info = wordInfoInput.value
  // update in-memory words array if present
  const idx = words.findIndex(w => w.id === selectedWordId)
  if (idx !== -1){
    words[idx].text = wordTextInput.value
    words[idx].info = wordInfoInput.value
  }
  infoArea.innerHTML = `<h3>${wordTextInput.value}</h3><p>${wordInfoInput.value || '<em>Sem informações</em>'}</p>`
  infoForm.classList.add('hidden')
  updateSentence()
})

cancelInfoBtn.addEventListener('click', ()=>{
  infoForm.classList.add('hidden')
})

clearBtn.addEventListener('click', ()=>{
  // move all words back to bank
  const placed = [...dropzoneEl.querySelectorAll('.word')]
  placed.forEach(w => bankEl.appendChild(w))
  updateSentence()
})

shuffleBtn.addEventListener('click', ()=>{
  // simple Fisher-Yates shuffle of words array and re-render bank
  for(let i=words.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));[words[i],words[j]]=[words[j],words[i]]
  }
  // Move all current elements back to bank, then re-create bank order
  const allWords = [...document.querySelectorAll('.word')]
  allWords.forEach(w => bankEl.appendChild(w))
  // reorder DOM according to words[]
  words.forEach(w=>{
    const el = document.getElementById(w.id)
    if (el) bankEl.appendChild(el)
  })
})

// initialize
function init(){
  // render initial word elements
  words.forEach(w => {
    const el = createWordEl(w)
    bankEl.appendChild(el)
  })

  // allow reordering inside dropzone by dragover position
  dropzoneEl.addEventListener('dragover', (e)=>{
    e.preventDefault()
    const dragging = document.querySelector('.dragging')
    const afterEl = getDropAfterElement(dropzoneEl, e.clientX, e.clientY)
    if (afterEl == null) return
  })

  updateSentence()
}

init()
