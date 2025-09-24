(function () {
  const webhookInput = document.getElementById('webhookUrl');
  const saveBtn = document.getElementById('saveSettings');
  const input = document.getElementById('input');
  const sendBtn = document.getElementById('send');
  const messages = document.getElementById('messages');

  // Restore settings
  const storedWebhook = localStorage.getItem('webhookUrl') || '';
  if (storedWebhook) {
    webhookInput.value = storedWebhook;
  } else if (location.origin.includes('localhost:3000')) {
    // When served by local proxy, default to /api/chat (bypass CORS)
    webhookInput.value = '/api/chat';
  }

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
    const webhookUrl = webhookInput.value.trim();
    const chatInput = input.value.trim();
    if (!webhookUrl) {
      alert('Vui lòng nhập Webhook URL.');
      return;
    }
    if (!chatInput) return;

    appendMessage('user', chatInput);
    input.value = '';
    input.style.height = 'auto';
    sendBtn.disabled = true;

    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Nếu webhook yêu cầu auth, thêm ở đây. Ví dụ:
          // 'Authorization': 'Bearer YOUR_TOKEN'
        },
        body: JSON.stringify({ chatInput, sessionId })
      });

      // Một số cấu hình n8n trả thẳng text, số khác trả JSON
      let respText = '';
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        // Thử các field phổ biến
        respText = data?.data ?? data?.message ?? data?.result ?? JSON.stringify(data);
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

  saveBtn.addEventListener('click', () => {
    const url = webhookInput.value.trim();
    localStorage.setItem('webhookUrl', url);
    alert('Đã lưu Webhook URL.');
  });

  // Gợi ý ban đầu
  appendMessage('bot', location.origin.includes('localhost:3000')
    ? 'Xin chào! Đang chạy qua proxy. Hãy dùng URL mặc định /api/chat hoặc thay đổi ở trên.'
    : 'Xin chào, mình là TuaTua. Hãy nhập câu hỏi của bạn!');
})();