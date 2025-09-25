(function () {
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const messages = document.getElementById('messages');

  // Session
  const sessionKey = 'tua_session_id';
  let sessionId = localStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
    localStorage.setItem(sessionKey, sessionId);
  }

  function appendMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `bubble ${role}`;
    bubble.textContent = text;
    messages.appendChild(bubble);
    messages.scrollTop = messages.scrollHeight;
  }

  async function sendMessage() {
    const chatInput = input.value.trim();
    if (!chatInput) return;

    appendMessage('user', chatInput);
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatInput, sessionId })
      });

      // Xử lý response từ n8n webhook
      let respText = '';
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        // Lấy text từ field output hoặc các field phổ biến khác
        respText = data?.output ?? data?.data ?? data?.message ?? data?.result ?? JSON.stringify(data);
      } else {
        respText = await res.text();
      }

      appendMessage('bot', respText || '(không có nội dung phản hồi)');
    } catch (err) {
      console.error(err);
      appendMessage('bot', 'Đã xảy ra lỗi khi gọi webhook.');
    } finally {
      sendBtn.disabled = false;
    }
  }

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 200) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  sendBtn.addEventListener('click', sendMessage);

  // Settings removed as webhook URL is configured in server

  // Gợi ý ban đầu
  appendMessage('bot', location.origin.includes('localhost:3000')
    ? 'Xin chào! Đang chạy qua proxy. Hãy dùng URL mặc định /api/chat hoặc thay đổi ở trên.'
    : 'Xin chào, mình là TuaTua. Hãy nhập câu hỏi của bạn!');
})();