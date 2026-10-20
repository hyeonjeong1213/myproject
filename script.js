
/**
 * GitHub Pages - script.js
 */

// 반드시 본인의 GAS 웹앱 배포 URL로 교체하세요.
const GAS_URL = '여기에_GAS_웹앱_URL을_입력';

const form = document.getElementById('guestbook-form');
const nameInput = document.getElementById('name');
const messageInput = document.getElementById('message');
const submitButton = document.getElementById('submit-button');
const formStatus = document.getElementById('form-status');
const listStatus = document.getElementById('list-status');
const messageList = document.getElementById('message-list');
const messageCount = document.getElementById('message-count');
const charCount = document.getElementById('char-count');
const refreshButton = document.getElementById('refresh-button');

let isLoading = false;
let isSubmitting = false;

function validateUrl() {
  if (!GAS_URL.startsWith('https://script.google.com/')) {
    throw new Error('GAS 웹앱 URL을 먼저 설정해 주세요.');
  }
}

// 방명록 목록 조회
async function loadMessages(showStatus = true) {
  if (isLoading) return;

  isLoading = true;
  refreshButton.disabled = true;

  if (showStatus) {
    listStatus.textContent = '방명록을 불러오는 중입니다.';
  }

  try {
    validateUrl();

    const url = new URL(GAS_URL);
    url.searchParams.set('action', 'list');
    url.searchParams.set('_', Date.now());

    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('서버 응답 오류: ' + response.status);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '목록 조회 실패');
    }

    renderMessages(result.messages || []);
    listStatus.textContent = result.messages.length
      ? '새로운 메시지는 자동으로 확인됩니다.'
      : '아직 등록된 메시지가 없어요. 첫 번째 방명록을 남겨 보세요!';

  } catch (error) {
    console.error(error);
    listStatus.textContent =
      '방명록을 불러오지 못했습니다. URL과 배포 권한을 확인해 주세요.';
  } finally {
    isLoading = false;
    refreshButton.disabled = false;
  }
}

// 메시지를 HTML 문자열이 아닌 DOM 요소로 출력해 XSS 방지
function renderMessages(messages) {
  messageList.replaceChildren();
  messageCount.textContent = messages.length;

  if (messages.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = '첫 번째 방명록의 주인공이 되어 주세요 ✨';
    messageList.appendChild(empty);
    return;
  }

  messages.forEach((item) => {
    const card = document.createElement('article');
    card.className = 'message-card';

    const meta = document.createElement('div');
    meta.className = 'message-meta';

    const name = document.createElement('span');
    name.className = 'message-name';
    name.textContent = item.name;

    const date = document.createElement('time');
    date.className = 'message-date';
    date.textContent = item.createdAt || '';
    if (item.createdAt) {
      date.dateTime = item.createdAt.replace(' ', 'T');
    }

    const content = document.createElement('p');
    content.className = 'message-content';
    content.textContent = item.message;

    meta.append(name, date);
    card.append(meta, content);
    messageList.appendChild(card);
  });
}

// 글자 수 표시
messageInput.addEventListener('input', () => {
  charCount.textContent = `${messageInput.value.length} / 500`;
});

// 방명록 등록
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (isSubmitting) return;

  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  if (!name || !message) {
    formStatus.textContent = '이름과 메시지를 모두 입력해 주세요.';
    return;
  }

  if (name.length > 30 || message.length > 500) {
    formStatus.textContent = '입력 가능한 글자 수를 확인해 주세요.';
    return;
  }

  isSubmitting = true;
  submitButton.disabled = true;
  submitButton.textContent = '등록 중...';
  formStatus.textContent = '';

  try {
    validateUrl();

    const response = await fetch(GAS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({ name, message }),
      redirect: 'follow'
    });

    if (!response.ok) {
      throw new Error('서버 응답 오류: ' + response.status);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || '등록에 실패했습니다.');
    }

    form.reset();
    charCount.textContent = '0 / 500';
    formStatus.textContent = '방명록이 등록되었습니다! 감사합니다.';

    await loadMessages();

  } catch (error) {
    console.error(error);
    formStatus.textContent =
      '등록에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  } finally {
    isSubmitting = false;
    submitButton.disabled = false;
    submitButton.innerHTML = '방명록 등록하기 <span>→</span>';
  }
});

// 수동 새로고침
refreshButton.addEventListener('click', () => {
  loadMessages();
});

// 15초마다 새 글 확인
setInterval(() => {
  if (!document.hidden) {
    loadMessages(false);
  }
}, 15000);

// 최초 목록 로딩
loadMessages();
