document.addEventListener('DOMContentLoaded', function() {
    // DOM元素
    const chatInput = document.getElementById('chat-input');
    const sendBtn = document.getElementById('send-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const chatMessages = document.getElementById('chat-messages');
    const taskInput = document.getElementById('task-input');
    const createTaskBtn = document.getElementById('create-task-btn');
    const taskList = document.getElementById('task-list');
    const refreshTasksBtn = document.getElementById('refresh-tasks-btn');
    const tabChat = document.getElementById('tab-chat');
    const tabTasks = document.getElementById('tab-tasks');
    const chatSection = document.getElementById('chat-section');
    const tasksSection = document.getElementById('tasks-section');
    
    // 标签切换
    tabChat.addEventListener('click', function() {
        tabChat.classList.add('active');
        tabTasks.classList.remove('active');
        chatSection.classList.add('active');
        tasksSection.classList.remove('active');
    });
    
    tabTasks.addEventListener('click', function() {
        tabChat.classList.remove('active');
        tabTasks.classList.add('active');
        chatSection.classList.remove('active');
        tasksSection.classList.add('active');
        loadTasks(); // 切换到任务标签时加载任务
    });
    
    // 发送聊天消息
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        // 添加用户消息到聊天界面
        addMessageToChat('user', message);
        chatInput.value = '';
        
        // 添加加载指示器
        const loadingId = addLoadingMessage();
        
        // 发送到后端
        fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message })
        })
        .then(response => response.json())
        .then(data => {
            removeLoadingMessage(loadingId);
            
            if (data.response) {
                // 格式化响应内容
                const formattedResponse = formatMarkdown(data.response);
                addFormattedMessageToChat('assistant', formattedResponse);
            } else if (data.error) {
                addMessageToChat('assistant', '错误: ' + data.error);
            }
        })
        .catch(error => {
            console.error('错误:', error);
            removeLoadingMessage(loadingId);
            addMessageToChat('assistant', '抱歉，出现了问题。请重试。');
        });
    }
    
    // 创建任务
    function createTask() {
        const description = taskInput.value.trim();
        if (!description) return;
        
        taskInput.value = '';
        
        // 显示加载状态
        const taskContainer = document.createElement('div');
        taskContainer.className = 'task-item loading';
        taskContainer.textContent = '正在创建任务...';
        taskList.prepend(taskContainer);
        
        // 发送任务到后端
        fetch('/task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description: description })
        })
        .then(response => response.json())
        .then(data => {
            taskContainer.remove();
            loadTasks(); // 刷新任务列表
        })
        .catch(error => {
            console.error('错误:', error);
            taskContainer.textContent = '创建任务时出错';
            taskContainer.className = 'task-item error';
        });
    }
    
    // 加载任务列表
    function loadTasks() {
        taskList.innerHTML = '<div class="loading">正在加载任务...</div>';
        
        fetch('/tasks')
        .then(response => response.json())
        .then(data => {
            taskList.innerHTML = '';
            
            if (data.tasks.length === 0) {
                taskList.innerHTML = '<div class="no-tasks">暂无任务</div>';
                return;
            }
            
            // 按创建时间倒序排序
            data.tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            
            data.tasks.forEach(task => {
                const taskItem = document.createElement('div');
                taskItem.className = 'task-item';
                
                const taskHeader = document.createElement('div');
                taskHeader.className = 'task-header';
                
                const taskTitle = document.createElement('div');
                taskTitle.className = 'task-title';
                taskTitle.textContent = task.description;
                
                const taskStatus = document.createElement('div');
                taskStatus.className = `task-status status-${task.status}`;
                
                // 翻译任务状态
                let statusText = task.status;
                if (task.status === 'pending') statusText = '进行中';
                else if (task.status === 'completed') statusText = '已完成';
                else if (task.status === 'failed') statusText = '失败';
                
                taskStatus.textContent = statusText;
                
                taskHeader.appendChild(taskTitle);
                taskHeader.appendChild(taskStatus);
                
                const taskInfo = document.createElement('div');
                taskInfo.className = 'task-info';
                taskInfo.textContent = `创建时间: ${new Date(task.created_at).toLocaleString()}`;
                
                taskItem.appendChild(taskHeader);
                taskItem.appendChild(taskInfo);
                
                if (task.result) {
                    const taskResult = document.createElement('div');
                    taskResult.className = 'task-result';
                    
                    // 格式化任务结果 - 添加Markdown支持
                    const formattedResult = formatMarkdown(task.result);
                    taskResult.innerHTML = formattedResult;
                    
                    taskItem.appendChild(taskResult);
                }
                
                taskList.appendChild(taskItem);
            });
        })
        .catch(error => {
            console.error('错误:', error);
            taskList.innerHTML = '<div class="error">加载任务时出错</div>';
        });
    }
    
    // 添加消息到聊天界面
    function addMessageToChat(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 添加已格式化的消息到聊天界面
    function addFormattedMessageToChat(role, formattedContent) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = formattedContent;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // 滚动到底部
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // 格式化Markdown文本，增强代码块显示
    function formatMarkdown(text) {
        if (!text) return '';
        
        // 临时存储代码块
        let codeBlocks = [];
        let codeBlockId = 0;
        
        // 先提取并保存代码块，用占位符替换
        let formattedWithCodePlaceholders = text.replace(/```(\w*)([\s\S]*?)```/g, function(match, language, code) {
            let placeholder = `__CODE_BLOCK_${codeBlockId}__`;
            codeBlocks.push({
                id: codeBlockId,
                language: language.toLowerCase(),
                code: escapeHtml(code.trim())
            });
            codeBlockId++;
            return placeholder;
        });
        
        // 处理标题格式 (在代码块被提取后)
        formattedWithCodePlaceholders = formattedWithCodePlaceholders.replace(/^(#{1,6})\s+(.*?)(?:\n|$)/gm, function(match, hashes, title) {
            const level = hashes.length;
            return `<h${level} class="markdown-heading">${title}</h${level}>`;
        });
        
        // 处理普通换行
        formattedWithCodePlaceholders = formattedWithCodePlaceholders.replace(/\n/g, '<br>');
        
        // 处理加粗文本
        formattedWithCodePlaceholders = formattedWithCodePlaceholders.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // 处理斜体文本
        formattedWithCodePlaceholders = formattedWithCodePlaceholders.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 处理段落（确保文本被正确包装）
        formattedWithCodePlaceholders = '<p>' + formattedWithCodePlaceholders.replace(/<br><br>/g, '</p><p>') + '</p>';
        formattedWithCodePlaceholders = formattedWithCodePlaceholders.replace(/<p><h/g, '<h');
        formattedWithCodePlaceholders = formattedWithCodePlaceholders.replace(/<\/h(\d)><\/p>/g, '</h$1>');
        
        // 最后，将代码块占位符替换回格式化的代码块
        let finalFormatted = formattedWithCodePlaceholders;
        for (let block of codeBlocks) {
            finalFormatted = finalFormatted.replace(
                `__CODE_BLOCK_${block.id}__`, 
                `<pre class="code-block ${block.language}"><code>${block.code}</code></pre>`
            );
        }
        
        return finalFormatted;
    }
    
    // HTML字符转义函数
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    // 添加加载指示器
    function addLoadingMessage() {
        const loadingId = 'loading-' + Date.now();
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'message assistant';
        loadingDiv.id = loadingId;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content loading';
        contentDiv.textContent = '思考中...';
        
        loadingDiv.appendChild(contentDiv);
        chatMessages.appendChild(loadingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        return loadingId;
    }
    
    // 移除加载指示器
    function removeLoadingMessage(id) {
        const loadingDiv = document.getElementById(id);
        if (loadingDiv) {
            loadingDiv.remove();
        }
    }
    
    // 清空聊天
    function clearChat() {
        if (confirm('确定要清空聊天记录吗？')) {
            chatMessages.innerHTML = '';
            
            // 调用后端清空记忆
            fetch('/memory/clear', {
                method: 'POST'
            })
            .then(response => response.json())
            .then(data => {
                console.log('记忆已清空');
            })
            .catch(error => {
                console.error('清空记忆时出错:', error);
            });
        }
    }
    
    // 事件监听器
    sendBtn.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    clearChatBtn.addEventListener('click', clearChat);
    
    createTaskBtn.addEventListener('click', createTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            createTask();
        }
    });
    
    refreshTasksBtn.addEventListener('click', loadTasks);
    
});