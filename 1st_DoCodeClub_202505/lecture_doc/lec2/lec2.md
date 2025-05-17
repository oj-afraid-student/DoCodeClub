# 1st Docode Club Lab2：AGI核心功能实现

---

## 一、AGI技术介绍

### 1.1 什么是AGI？

AGI（Artificial General Intelligence，通用人工智能）指的是具备人类认知能力的人工智能系统，能够像人类一样灵活、泛化地完成不同领域的任务。

AGI 不依赖于特定任务训练，而能够：

- 理解并生成自然语言、图像、视频等多模态信息
- 学习新技能、解决新问题
- 拥有持续性记忆与自我目标规划能力

AGI 是当前AIGC与LLM技术发展的终极目标，也是学术界和产业界共同探索的前沿方向。

### 1.2 什么是AIGC？

AIGC (人工智能自动生成内容，AI Generated Content)是指利用人工智能技术生成文本、图片、音频、代码等内容。

它从"对数据分析"进化为"实际创作力"，在文字创作（ChatGPT）、图像生成（Stable Diffusion）、代码生成（GitHub Copilot）等方面得到应用。

### 1.3 什么是LLM？

大型语言模型（LLM，Large Language Model）是AIGC的核心技术，通过大量文本进行预训练，可以生成有调性、有评价、有结构的内容。

常见LLM：

* OpenAI GPT-4 / ChatGPT
* DeepSeek
* Claude
* LLaMA

---

## 二、Prompt工程基础

### 2.1 Prompt是什么？

Prompt = 给AI一个指令/列表，使它产生预期结果

### 2.2 Prompt 写体格式

1. 身份设定："你是一个专业统计分析师"
2. 第一个消息：用"system" 或 "user"设定对话规则
3. 指定结果格式："以markdown格式输出" "必须使用python代码块"
4. 给出示例：提供既有的input-output对

### 2.3 Prompt 工程经典模式

* Zero-shot: 直接提问
* One-shot: 给一个示例
* Few-shot: 给出3\~5个示例
* Chain-of-thought: 强调分步理解和解题
* ReAct: 给出 "思考+操作" 链

---

## 三、后端服务搭建基础

### 3.1 Flask 简介（背景知识）

[Flask 官网：https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)

Flask 是一个用 Python 编写的轻量级 Web 应用框架，适用于快速开发后端接口。其特点是简洁、灵活、可扩展，适合 AIGC 原型系统搭建，例如本次“笃小实AI”。

特点：

- **轻量简单**：核心包功能精简，可按需添加插件
- **请求处理**：支持 GET、POST 等 HTTP 方法
- **路由系统**：URL 到函数的映射机制（如 `/chat` 处理对话）
- **模板支持**：集成 Jinja2，可动态渲染 HTML 页面
- **易部署**：开发阶段自带服务器，生产环境可用 Gunicorn、Docker 等部署

### 3.2 组成组件

以Flask为基础构建后端：

* `app.py` 主程序启动和接口路由
* `core/llm.py`：调用DeepSeek API
* `core/agent.py`：任务处理和对话介绍
* `core/memory.py`：简单存储对话历史
* `core/task_manager.py`：管理任务列表
* `.env`：API配置

### 3.3 基本流程

* 用户输入消息
* Flask 接受请求调用 `ToyAGI.chat()`
* chat 通过 `llm.generate_response()` 调用 LLM
* 返回消息、存入 memory

---

## 四、实操教程：搭建简单的第一个自己的AI

### 步骤 1：创建目录和文件

```
docode_ai/
|-- app.py
|-- core/
|   |-- __init__.py
|   |-- llm.py
|   |-- agent.py
|   |-- memory.py
|   |-- task_manager.py
|-- config.py
|-- .env
|-- requirements.txt
```

### 步骤 2：填写 .env 文件

```env
DEEPSEEK_API_KEY=your_api_key_here
SECRET_KEY=any_random_string
```

### 步骤 3：编写 `llm.py`

```python
# core/llm.py
import requests
from config import DEEPSEEK_API_KEY

class DeepSeekLLM:
    def __init__(self):
        self.api_url = "https://platform.deepseek.com/v1/chat/completions"
        self.api_key = DEEPSEEK_API_KEY

    def generate_response(self, messages):
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "model": "DeepSeek-R1-67B",
            "messages": messages,
            "temperature": 0.6
        }
        response = requests.post(self.api_url, headers=headers, json=payload)
        return response.json()["choices"][0]["message"]["content"]
```

### 步骤 4：编写 `agent.py`

```python
# core/agent.py
from core.llm import DeepSeekLLM

class ToyAGI:
    def __init__(self):
        self.llm = DeepSeekLLM()
        self.memory = []

    def chat(self, user_input):
        self.memory.append({"role": "user", "content": user_input})
        messages = [{"role": "system", "content": "你是一个有帮助性的AI"}]
        messages.extend(self.memory)
        reply = self.llm.generate_response(messages)
        self.memory.append({"role": "assistant", "content": reply})
        return reply
```

### 步骤 5：编写 `app.py`

```python
# app.py
from flask import Flask, request, jsonify
from core.agent import ToyAGI

app = Flask(__name__)
toyagi = ToyAGI()

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message", "")
    response = toyagi.chat(user_message)
    return jsonify({"response": response})

if __name__ == "__main__":
    app.run(debug=True)
```

### 步骤 6：启动服务并测试

```bash
# 安装依赖
pip install flask requests python-dotenv

# 启动
python app.py

# 测试
curl -X POST http://127.0.0.1:5000/chat -H "Content-Type: application/json" -d '{"message":"你好"}'
```

## 五、常见问题与解决方法

1. 与笃小实对话中出现

   ```
   Sorry, I encountered an error: ('Connection aborted.', ConnectionAbortedError(10053, '你的主机中的软件中止了一个已建立的连接。', None, 10053, None))
   ```

   解决方法：将网络切换为校园网（再重启程序）

## 六、参考资料与学习资源

1. **Git 学习资源**：
   - [Git 官方文档](https://git-scm.com/doc)
   - [GitHub 使用指南](https://docs.github.com/cn)
   - [Git 简明指南](http://rogerdudler.github.io/git-guide/index.zh.html)
2. **Python 学习资源**：
   - [Python 官方文档](https://docs.python.org/zh-cn/3/)
   - [廖雪峰 Python 教程](https://www.liaoxuefeng.com/wiki/1016959663602400)
   - [Python 编程：从入门到实践（书籍）](https://book.douban.com/subject/35196328/)
3. **数据科学与机器学习资源**：
   - [NumPy 官方文档](https://numpy.org/doc/)
   - [Pandas 官方文档](https://pandas.pydata.org/docs/)
   - [Matplotlib 官方文档](https://matplotlib.org/stable/users/index.html)
4. **在线学习平台**：
   - [LeetCode](https://leetcode.cn/)：算法练习
   - [Coursera](https://www.coursera.org/)：各类课程
   - [DataCamp](https://www.datacamp.com/)：数据科学课程


> # 祝各位在 DoCode 营中学习愉快，掌握实用技能！
