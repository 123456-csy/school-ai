// 调用本地代理 API
const API_URL = '/api/chat';

// 获取 DOM 元素
const messagesContainer = document.getElementById('messages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const loadingDiv = document.getElementById('loading');

// 保存对话历史（用于上下文）
let conversationHistory = [
  { role: 'system', content: '你是一个专业的校园AI助手，专门回答关于大学学习、生活、校园设施、活动、校历、选课、图书馆等问题。\n\n规则：\n1. 只回答与校园相关的问题\n2. 回答必须准确、真实、有用\n3. 如果问题与校园无关，请礼貌拒绝\n4. 如果不知道答案，请直接说"不知道"\n5. 回答要简洁明了，避免冗长\n6. 使用中文回答，语气友好亲切' }
];

// 添加消息到界面
function addMessage(content, isUser = false) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
  messageDiv.innerHTML = `
        <div class="avatar">${isUser ? '👤' : '🤖'}</div>
        <div class="content">${formatContent(content)}</div>
    `;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  // 如果不是用户消息，保存到历史（assistant回复）
  if (!isUser) {
    conversationHistory.push({ role: 'assistant', content: content });
  }
}

// 简单的 Markdown 渲染（支持代码块、加粗等）
function formatContent(text) {
  // 转义 HTML
  let formatted = text.replace(/[&<>]/g, function (m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
  // 处理代码块 ```code```
  formatted = formatted.replace(/```(\w+)?\n([\s\S]*?)```/g, function (match, lang, code) {
    return `<pre><code class="language-${lang || 'plaintext'}">${code.trim()}</code></pre>`;
  });
  // 处理行内代码 `code`
  formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
  // 处理加粗 **bold**
  formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // 换行转 <br>
  formatted = formatted.replace(/\n/g, '<br>');
  return formatted;
}

// 调用本地代理 API
async function sendMessageToAI(userMessage) {
  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: conversationHistory
      })
    });

    if (!response.ok) {
      throw new Error(`请求失败: ${response.status}`);
    }

    const data = await response.json();
    const assistantReply = data.reply;
    conversationHistory.push({ role: 'assistant', content: assistantReply });
    return assistantReply;
  } catch (error) {
    console.error('AI 调用错误:', error);
    return '抱歉，我现在无法回答。请稍后再试。';
  }
}

// 处理发送
async function handleSend() {
  const text = userInput.value.trim();
  if (!text) return;

  // 清空输入框并恢复高度
  userInput.value = '';
  userInput.style.height = 'auto';

  // 显示用户消息
  addMessage(text, true);

  // 显示加载中
  loadingDiv.style.display = 'block';

  // 调用AI
  const reply = await sendMessageToAI(text);

  // 隐藏加载
  loadingDiv.style.display = 'none';

  // 显示AI回复
  addMessage(reply, false);

  // 可选：代码高亮重新渲染
  if (typeof hljs !== 'undefined') {
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block);
    });
  }
}

// 发送按钮点击
sendBtn.addEventListener('click', handleSend);

// 按 Enter 发送（Shift+Enter 换行）
userInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    handleSend();
  }
});

// 自动调整textarea高度
userInput.addEventListener('input', function () {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});