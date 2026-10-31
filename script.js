const hamburger = document.getElementById('hamburger');
const dropdown = document.getElementById('dropdown');
const sections = document.querySelectorAll('.section');

hamburger.addEventListener('click', () => {
  dropdown.classList.toggle('open');
});

document.addEventListener('click', (e) => {
  if (!hamburger.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('open');
  }
});

function switchTab(name) {
  sections.forEach(s => s.style.display = 'none');
  document.getElementById(name).style.display = 'block';
  dropdown.classList.remove('open');
}

document.querySelectorAll('#dropdown div').forEach(item => {
  item.addEventListener('click', () => {
    switchTab(item.dataset.tab);
  });
});

document.getElementById('openVaultBtn').addEventListener('click', () => {
  switchTab('vault');
});

function generateHexId() {
  const chars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < 12; i++) {
    hex += chars[Math.floor(Math.random() * 16)];
  }
  return hex;
}

const luaInput = document.getElementById('luaInput');
const vaultCard = document.getElementById('vaultCard');
const vaultIdText = document.getElementById('vaultIdText');
const vaultUrl = document.getElementById('vaultUrl');
const codeBlock = document.getElementById('codeBlock');
const generateBtn = document.getElementById('generateBtn');
const copyBtn = document.getElementById('copyLoadstring');

let currentId = '';
let currentUrl = '';
let currentLoadstring = '';

function generateVaulth() {
  const hex = generateHexId();
  currentId = `vx_${hex}.lua`;
  currentUrl = `https://luau-pro.vercel.app/api/raw?id=vx_${hex}.lua`;
  const userLua = luaInput.value.trim();
  
  vaultIdText.textContent = currentId;
  vaultUrl.textContent = currentUrl;
  
  currentLoadstring = `loadstring(game:HttpGet("${currentUrl}"))()`;
  
  codeBlock.textContent = currentLoadstring;
  vaultCard.style.display = 'block';

  localStorage.setItem(currentId, userLua);
  localStorage.setItem(currentId + '_url', currentUrl);
}

generateBtn.addEventListener('click', generateVaulth);

copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(currentLoadstring);
  copyBtn.textContent = 'COPIED';
  setTimeout(() => {
    copyBtn.textContent = 'COPY';
  }, 1500);
});

codeBlock.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

codeBlock.addEventListener('selectstart', (e) => {
  e.preventDefault();
  return false;
});

switchTab('home');
