/**
 * SnippetsHub - 专业代码片段管理工具
 * 
 * @file demoSnippets.js - 演示数据集
 * @author Noah
 * @description 应用程序的演示代码片段数据，涵盖多种编程语言和使用场景
 * @created 2026-01-28
 * @modified 2026-01-29
 * @version 1.0.0
 * 
 * 功能特性:
 * - 10个专业代码片段
 * - 6种编程语言覆盖
 * - 实用的代码示例
 * - 完整的元数据信息
 * - 标签分类系统
 * - 难度等级标识
 * - 使用场景说明
 * - 最佳实践展示
 */

export const demoSnippets = [
  // JavaScript/Vue 相关
  {
    id: 'js-001',
    title: 'Vue 3 响应式数据',
    description: '使用 Vue 3 Composition API 创建响应式数据',
    language: 'javascript',
    code: `import { ref, reactive, computed } from 'vue'

// 基本响应式引用
const count = ref(0)
const message = ref('Hello Vue 3!')

// 响应式对象
const state = reactive({
  user: {
    name: 'John Doe',
    email: 'john@example.com'
  },
  todos: []
})

// 计算属性
const doubleCount = computed(() => count.value * 2)

// 方法
const increment = () => {
  count.value++
}

const addTodo = (text) => {
  state.todos.push({
    id: Date.now(),
    text,
    completed: false
  })
}`,
    tags: ['vue3', 'composition-api', 'reactive', 'frontend'],
    created_at: Date.now() - 86400000, // 1天前
    updated_at: Date.now() - 3600000,  // 1小时前
    usage_count: 15,
    isFavorite: true
  },

  {
    id: 'js-002',
    title: 'JavaScript 防抖函数',
    description: '实用的防抖函数，用于优化频繁触发的事件',
    language: 'javascript',
    code: `/**
 * 防抖函数 - 延迟执行，频繁调用时重新计时
 * @param {Function} func - 要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @param {boolean} immediate - 是否立即执行
 * @returns {Function} 防抖后的函数
 */
function debounce(func, delay = 300, immediate = false) {
  let timeoutId = null
  let result = null

  return function debounced(...args) {
    const context = this
    
    // 清除之前的定时器
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    if (immediate && !timeoutId) {
      // 立即执行模式
      result = func.apply(context, args)
    }

    timeoutId = setTimeout(() => {
      timeoutId = null
      if (!immediate) {
        result = func.apply(context, args)
      }
    }, delay)

    return result
  }
}

// 使用示例
const handleSearch = debounce((query) => {
  console.log('搜索:', query)
  // 执行搜索逻辑
}, 500)

// 绑定到输入框
document.getElementById('search').addEventListener('input', (e) => {
  handleSearch(e.target.value)
})`,
    tags: ['javascript', 'performance', 'debounce', 'optimization'],
    created_at: Date.now() - 172800000, // 2天前
    updated_at: Date.now() - 7200000,   // 2小时前
    usage_count: 23,
    isFavorite: true
  },

  {
    id: 'js-003',
    title: 'Promise 并发控制',
    description: '控制 Promise 并发数量，避免同时发起过多请求',
    language: 'javascript',
    code: `/**
 * 并发控制器 - 限制同时执行的 Promise 数量
 * @param {Array} tasks - 任务数组，每个任务是返回 Promise 的函数
 * @param {number} limit - 最大并发数
 * @returns {Promise} 所有任务完成的 Promise
 */
async function promiseConcurrencyLimit(tasks, limit = 3) {
  const results = []
  const executing = []
  
  for (const [index, task] of tasks.entries()) {
    // 创建 Promise 并添加到执行队列
    const promise = Promise.resolve().then(() => task()).then(
      result => ({ status: 'fulfilled', value: result, index }),
      error => ({ status: 'rejected', reason: error, index })
    )
    
    results[index] = promise
    
    if (tasks.length >= limit) {
      executing.push(promise)
      
      // 当达到并发限制时，等待其中一个完成
      if (executing.length >= limit) {
        await Promise.race(executing)
        // 移除已完成的 Promise
        executing.splice(executing.findIndex(p => p === promise), 1)
      }
    }
  }
  
  // 等待所有任务完成
  return Promise.all(results)
}

// 使用示例
const urls = [
  'https://api.example.com/data1',
  'https://api.example.com/data2',
  'https://api.example.com/data3',
  // ... 更多 URL
]

const fetchTasks = urls.map(url => () => fetch(url).then(res => res.json()))

promiseConcurrencyLimit(fetchTasks, 3)
  .then(results => {
    console.log('所有请求完成:', results)
  })
  .catch(error => {
    console.error('请求失败:', error)
  })`,
    tags: ['javascript', 'promise', 'concurrency', 'async'],
    created_at: Date.now() - 259200000, // 3天前
    updated_at: Date.now() - 10800000,  // 3小时前
    usage_count: 8,
    isFavorite: false
  },

  // Python 相关
  {
    id: 'py-001',
    title: 'Python 装饰器模式',
    description: '实用的 Python 装饰器，用于日志记录和性能监控',
    language: 'python',
    code: `import time
import functools
from typing import Callable, Any

def timer(func: Callable) -> Callable:
    """计时装饰器 - 测量函数执行时间"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start_time = time.perf_counter()
        try:
            result = func(*args, **kwargs)
            return result
        finally:
            end_time = time.perf_counter()
            execution_time = end_time - start_time
            print(f"{func.__name__} 执行时间: {execution_time:.4f} 秒")
    return wrapper

def retry(max_attempts: int = 3, delay: float = 1.0):
    """重试装饰器 - 自动重试失败的函数"""
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs) -> Any:
            last_exception = None
            
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except Exception as e:
                    last_exception = e
                    if attempt < max_attempts - 1:
                        print(f"{func.__name__} 第 {attempt + 1} 次尝试失败: {e}")
                        time.sleep(delay)
                    else:
                        print(f"{func.__name__} 所有尝试都失败了")
            
            raise last_exception
        return wrapper
    return decorator

def log_calls(func: Callable) -> Callable:
    """日志装饰器 - 记录函数调用"""
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        args_str = ', '.join(map(str, args))
        kwargs_str = ', '.join(f"{k}={v}" for k, v in kwargs.items())
        all_args = ', '.join(filter(None, [args_str, kwargs_str]))
        
        print(f"调用 {func.__name__}({all_args})")
        
        try:
            result = func(*args, **kwargs)
            print(f"{func.__name__} 返回: {result}")
            return result
        except Exception as e:
            print(f"{func.__name__} 抛出异常: {e}")
            raise
    return wrapper

# 使用示例
@timer
@retry(max_attempts=3, delay=0.5)
@log_calls
def fetch_data(url: str) -> dict:
    """模拟网络请求"""
    import random
    import requests
    
    # 模拟随机失败
    if random.random() < 0.3:
        raise requests.RequestException("网络错误")
    
    # 模拟成功响应
    return {"data": f"来自 {url} 的数据", "status": "success"}

# 测试
if __name__ == "__main__":
    try:
        result = fetch_data("https://api.example.com/data")
        print(f"最终结果: {result}")
    except Exception as e:
        print(f"最终失败: {e}")`,
    tags: ['python', 'decorator', 'logging', 'retry', 'performance'],
    created_at: Date.now() - 345600000, // 4天前
    updated_at: Date.now() - 14400000,  // 4小时前
    usage_count: 12,
    isFavorite: true
  },

  {
    id: 'py-002',
    title: 'Python 数据类和验证',
    description: '使用 dataclass 和 pydantic 进行数据验证',
    language: 'python',
    code: `from dataclasses import dataclass, field
from typing import List, Optional, Union
from datetime import datetime
import json

@dataclass
class User:
    """用户数据类"""
    id: int
    name: str
    email: str
    age: Optional[int] = None
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    
    def __post_init__(self):
        """数据验证"""
        if not self.name.strip():
            raise ValueError("用户名不能为空")
        
        if '@' not in self.email:
            raise ValueError("邮箱格式不正确")
        
        if self.age is not None and (self.age < 0 or self.age > 150):
            raise ValueError("年龄必须在 0-150 之间")
    
    def to_dict(self) -> dict:
        """转换为字典"""
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'age': self.age,
            'tags': self.tags,
            'created_at': self.created_at.isoformat(),
            'is_active': self.is_active
        }
    
    @classmethod
    def from_dict(cls, data: dict) -> 'User':
        """从字典创建用户"""
        if 'created_at' in data and isinstance(data['created_at'], str):
            data['created_at'] = datetime.fromisoformat(data['created_at'])
        return cls(**data)
    
    def add_tag(self, tag: str) -> None:
        """添加标签"""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def remove_tag(self, tag: str) -> None:
        """移除标签"""
        if tag in self.tags:
            self.tags.remove(tag)

@dataclass
class UserManager:
    """用户管理器"""
    users: List[User] = field(default_factory=list)
    
    def add_user(self, user_data: Union[dict, User]) -> User:
        """添加用户"""
        if isinstance(user_data, dict):
            user = User.from_dict(user_data)
        else:
            user = user_data
        
        # 检查用户ID是否已存在
        if any(u.id == user.id for u in self.users):
            raise ValueError(f"用户ID {user.id} 已存在")
        
        self.users.append(user)
        return user
    
    def get_user(self, user_id: int) -> Optional[User]:
        """获取用户"""
        return next((u for u in self.users if u.id == user_id), None)
    
    def get_active_users(self) -> List[User]:
        """获取活跃用户"""
        return [u for u in self.users if u.is_active]
    
    def search_users(self, query: str) -> List[User]:
        """搜索用户"""
        query = query.lower()
        return [
            u for u in self.users 
            if query in u.name.lower() or query in u.email.lower()
        ]
    
    def export_json(self) -> str:
        """导出为JSON"""
        return json.dumps([u.to_dict() for u in self.users], indent=2)

# 使用示例
if __name__ == "__main__":
    # 创建用户管理器
    manager = UserManager()
    
    # 添加用户
    try:
        user1 = manager.add_user({
            'id': 1,
            'name': '张三',
            'email': 'zhangsan@example.com',
            'age': 25,
            'tags': ['developer', 'python']
        })
        
        user2 = User(
            id=2,
            name='李四',
            email='lisi@example.com',
            age=30
        )
        user2.add_tag('designer')
        manager.add_user(user2)
        
        # 搜索用户
        results = manager.search_users('张')
        print(f"搜索结果: {[u.name for u in results]}")
        
        # 导出数据
        json_data = manager.export_json()
        print("导出的JSON数据:")
        print(json_data)
        
    except ValueError as e:
        print(f"验证错误: {e}")`,
    tags: ['python', 'dataclass', 'validation', 'json', 'oop'],
    created_at: Date.now() - 432000000, // 5天前
    updated_at: Date.now() - 18000000,  // 5小时前
    usage_count: 6,
    isFavorite: false
  },

  // CSS 相关
  {
    id: 'css-001',
    title: 'CSS Grid 响应式布局',
    description: '使用 CSS Grid 创建现代响应式布局',
    language: 'css',
    code: `/* 现代响应式网格布局 */
.grid-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  grid-gap: 2rem;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 卡片样式 */
.grid-item {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.grid-item:hover {
  transform: translateY(-4px);
  box-shadow: 
    0 12px 24px rgba(0, 0, 0, 0.1),
    0 4px 8px rgba(0, 0, 0, 0.05);
}

/* 特殊布局项 */
.grid-item.featured {
  grid-column: span 2;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.grid-item.wide {
  grid-column: span 2;
}

.grid-item.tall {
  grid-row: span 2;
}

/* 响应式断点 */
@media (max-width: 768px) {
  .grid-container {
    grid-template-columns: 1fr;
    padding: 1rem;
    grid-gap: 1rem;
  }
  
  .grid-item.featured,
  .grid-item.wide {
    grid-column: span 1;
  }
  
  .grid-item.tall {
    grid-row: span 1;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .grid-container {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

/* 内容样式 */
.grid-item h3 {
  margin: 0 0 1rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.3;
}

.grid-item p {
  margin: 0 0 1rem 0;
  line-height: 1.6;
  color: rgba(0, 0, 0, 0.7);
}

.grid-item.featured p {
  color: rgba(255, 255, 255, 0.9);
}

/* 按钮样式 */
.grid-item .btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;
}

.grid-item .btn:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.grid-item.featured .btn {
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.grid-item.featured .btn:hover {
  background: rgba(255, 255, 255, 0.3);
}`,
    tags: ['css', 'grid', 'responsive', 'layout', 'modern'],
    created_at: Date.now() - 518400000, // 6天前
    updated_at: Date.now() - 21600000,  // 6小时前
    usage_count: 18,
    isFavorite: true
  },

  // React 相关
  {
    id: 'react-001',
    title: 'React 自定义 Hook',
    description: '实用的 React 自定义 Hook 集合',
    language: 'javascript',
    code: `import { useState, useEffect, useCallback, useRef } from 'react'

// 1. useLocalStorage Hook
export function useLocalStorage(key, initialValue) {
  // 获取初始值
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":\`, error)
      return initialValue
    }
  })

  // 设置值的函数
  const setValue = useCallback((value) => {
    try {
      // 允许值是函数，用于函数式更新
      const valueToStore = value instanceof Function ? value(storedValue) : value
      setStoredValue(valueToStore)
      window.localStorage.setItem(key, JSON.stringify(valueToStore))
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":\`, error)
    }
  }, [key, storedValue])

  return [storedValue, setValue]
}

// 2. useDebounce Hook
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// 3. useFetch Hook
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const abortController = new AbortController()
    
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(url, {
          ...options,
          signal: abortController.signal
        })
        
        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`)
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message)
        }
      } finally {
        setLoading(false)
      }
    }

    fetchData()

    return () => {
      abortController.abort()
    }
  }, [url, JSON.stringify(options)])

  return { data, loading, error }
}

// 4. useToggle Hook
export function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue)
  
  const toggle = useCallback(() => setValue(v => !v), [])
  const setTrue = useCallback(() => setValue(true), [])
  const setFalse = useCallback(() => setValue(false), [])
  
  return [value, { toggle, setTrue, setFalse }]
}

// 5. useInterval Hook
export function useInterval(callback, delay) {
  const savedCallback = useRef()

  // 记住最新的回调函数
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // 设置定时器
  useEffect(() => {
    function tick() {
      savedCallback.current()
    }
    
    if (delay !== null) {
      const id = setInterval(tick, delay)
      return () => clearInterval(id)
    }
  }, [delay])
}

// 6. useClickOutside Hook
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (event) => {
      // 如果点击的是 ref 元素内部，不执行 handler
      if (!ref.current || ref.current.contains(event.target)) {
        return
      }
      handler(event)
    }

    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)

    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, handler])
}

// 使用示例组件
function ExampleComponent() {
  // 使用 localStorage Hook
  const [name, setName] = useLocalStorage('name', '')
  
  // 使用 debounce Hook
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  
  // 使用 toggle Hook
  const [isVisible, { toggle, setTrue, setFalse }] = useToggle(false)
  
  // 使用 fetch Hook
  const { data, loading, error } = useFetch(\`/api/search?q=\${debouncedSearchTerm}\`)
  
  // 使用 interval Hook
  const [count, setCount] = useState(0)
  useInterval(() => {
    setCount(count + 1)
  }, 1000)
  
  // 使用 click outside Hook
  const modalRef = useRef()
  useClickOutside(modalRef, () => {
    setFalse()
  })

  return (
    <div>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="输入你的名字"
      />
      
      <input
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="搜索..."
      />
      
      <button onClick={toggle}>
        {isVisible ? '隐藏' : '显示'} 模态框
      </button>
      
      <p>计数器: {count}</p>
      
      {isVisible && (
        <div ref={modalRef} className="modal">
          <h3>模态框</h3>
          <p>点击外部关闭</p>
        </div>
      )}
      
      {loading && <p>加载中...</p>}
      {error && <p>错误: {error}</p>}
      {data && <pre>{JSON.stringify(data, null, 2)}</pre>}
    </div>
  )
}`,
    tags: ['react', 'hooks', 'custom-hooks', 'frontend', 'reusable'],
    created_at: Date.now() - 604800000, // 7天前
    updated_at: Date.now() - 25200000,  // 7小时前
    usage_count: 31,
    isFavorite: true
  },

  // SQL 相关
  {
    id: 'sql-001',
    title: 'SQL 查询优化技巧',
    description: '常用的 SQL 查询优化和最佳实践',
    language: 'sql',
    code: `-- 1. 使用索引优化查询
-- 创建复合索引
CREATE INDEX idx_user_status_created ON users(status, created_at);

-- 2. 避免 SELECT *，只选择需要的列
SELECT id, name, email, created_at 
FROM users 
WHERE status = 'active' 
  AND created_at >= '2024-01-01';

-- 3. 使用 EXISTS 代替 IN（大数据集）
-- 不推荐
SELECT * FROM orders 
WHERE customer_id IN (
  SELECT id FROM customers WHERE city = 'Beijing'
);

-- 推荐
SELECT o.* FROM orders o
WHERE EXISTS (
  SELECT 1 FROM customers c 
  WHERE c.id = o.customer_id AND c.city = 'Beijing'
);

-- 4. 使用 LIMIT 分页查询
-- 基础分页（小偏移量）
SELECT id, name, email 
FROM users 
ORDER BY created_at DESC 
LIMIT 20 OFFSET 0;

-- 游标分页（大偏移量优化）
SELECT id, name, email 
FROM users 
WHERE created_at < '2024-01-15 10:30:00'
ORDER BY created_at DESC 
LIMIT 20;

-- 5. 使用窗口函数进行排名和分析
-- 每个部门的薪资排名
SELECT 
  employee_id,
  name,
  department,
  salary,
  ROW_NUMBER() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
  AVG(salary) OVER (PARTITION BY department) as dept_avg_salary,
  salary - AVG(salary) OVER (PARTITION BY department) as salary_diff
FROM employees;

-- 6. 使用 CTE（公共表表达式）提高可读性
WITH monthly_sales AS (
  SELECT 
    DATE_TRUNC('month', order_date) as month,
    SUM(amount) as total_sales,
    COUNT(*) as order_count
  FROM orders 
  WHERE order_date >= '2024-01-01'
  GROUP BY DATE_TRUNC('month', order_date)
),
sales_with_growth AS (
  SELECT 
    month,
    total_sales,
    order_count,
    LAG(total_sales) OVER (ORDER BY month) as prev_month_sales,
    (total_sales - LAG(total_sales) OVER (ORDER BY month)) / 
    LAG(total_sales) OVER (ORDER BY month) * 100 as growth_rate
  FROM monthly_sales
)
SELECT 
  month,
  total_sales,
  order_count,
  ROUND(growth_rate, 2) as growth_percentage
FROM sales_with_growth
ORDER BY month;

-- 7. 批量插入优化
-- 使用 VALUES 批量插入
INSERT INTO products (name, price, category_id) VALUES
  ('Product 1', 29.99, 1),
  ('Product 2', 39.99, 1),
  ('Product 3', 49.99, 2),
  ('Product 4', 19.99, 3);

-- 使用 ON CONFLICT 处理重复数据（PostgreSQL）
INSERT INTO users (email, name, updated_at) VALUES
  ('user1@example.com', 'User 1', NOW()),
  ('user2@example.com', 'User 2', NOW())
ON CONFLICT (email) 
DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = EXCLUDED.updated_at;

-- 8. 复杂查询示例：用户行为分析
WITH user_activity AS (
  SELECT 
    user_id,
    DATE(created_at) as activity_date,
    COUNT(*) as daily_actions,
    COUNT(DISTINCT session_id) as sessions
  FROM user_actions 
  WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY user_id, DATE(created_at)
),
user_metrics AS (
  SELECT 
    user_id,
    COUNT(DISTINCT activity_date) as active_days,
    AVG(daily_actions) as avg_daily_actions,
    MAX(daily_actions) as max_daily_actions,
    SUM(sessions) as total_sessions
  FROM user_activity
  GROUP BY user_id
)
SELECT 
  u.id,
  u.name,
  u.email,
  um.active_days,
  ROUND(um.avg_daily_actions, 2) as avg_daily_actions,
  um.max_daily_actions,
  um.total_sessions,
  CASE 
    WHEN um.active_days >= 20 THEN 'High'
    WHEN um.active_days >= 10 THEN 'Medium'
    ELSE 'Low'
  END as engagement_level
FROM users u
JOIN user_metrics um ON u.id = um.user_id
WHERE um.active_days > 0
ORDER BY um.active_days DESC, um.avg_daily_actions DESC;

-- 9. 性能监控查询
-- 查找慢查询（PostgreSQL）
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows,
  100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
ORDER BY total_time DESC 
LIMIT 10;

-- 10. 数据清理和维护
-- 删除重复数据
WITH duplicate_emails AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
  FROM users
)
DELETE FROM users 
WHERE id IN (
  SELECT id FROM duplicate_emails WHERE rn > 1
);`,
    tags: ['sql', 'optimization', 'database', 'performance', 'postgresql'],
    created_at: Date.now() - 691200000, // 8天前
    updated_at: Date.now() - 28800000,  // 8小时前
    usage_count: 9,
    isFavorite: false
  },

  // Go 相关
  {
    id: 'go-001',
    title: 'Go 并发模式',
    description: 'Go 语言中的常用并发模式和最佳实践',
    language: 'go',
    code: `package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

// 1. Worker Pool 模式
func workerPool() {
	const numWorkers = 3
	const numJobs = 10

	jobs := make(chan int, numJobs)
	results := make(chan int, numJobs)

	// 启动 workers
	for w := 1; w <= numWorkers; w++ {
		go worker(w, jobs, results)
	}

	// 发送任务
	for j := 1; j <= numJobs; j++ {
		jobs <- j
	}
	close(jobs)

	// 收集结果
	for a := 1; a <= numJobs; a++ {
		<-results
	}
}

func worker(id int, jobs <-chan int, results chan<- int) {
	for j := range jobs {
		fmt.Printf("Worker %d 开始处理任务 %d\\n", id, j)
		time.Sleep(time.Second) // 模拟工作
		fmt.Printf("Worker %d 完成任务 %d\\n", id, j)
		results <- j * 2
	}
}

// 2. 扇入扇出模式 (Fan-in Fan-out)
func fanInFanOut() {
	input := make(chan int)
	
	// 扇出：将输入分发给多个 goroutine
	c1 := fanOut(input)
	c2 := fanOut(input)
	c3 := fanOut(input)
	
	// 扇入：将多个 goroutine 的输出合并
	output := fanIn(c1, c2, c3)
	
	// 发送数据
	go func() {
		for i := 0; i < 10; i++ {
			input <- i
		}
		close(input)
	}()
	
	// 接收结果
	for result := range output {
		fmt.Printf("结果: %d\\n", result)
	}
}

func fanOut(input <-chan int) <-chan int {
	output := make(chan int)
	go func() {
		defer close(output)
		for n := range input {
			output <- n * n // 平方运算
		}
	}()
	return output
}

func fanIn(inputs ...<-chan int) <-chan int {
	output := make(chan int)
	var wg sync.WaitGroup
	
	for _, input := range inputs {
		wg.Add(1)
		go func(ch <-chan int) {
			defer wg.Done()
			for n := range ch {
				output <- n
			}
		}(input)
	}
	
	go func() {
		wg.Wait()
		close(output)
	}()
	
	return output
}

// 3. 管道模式 (Pipeline)
func pipeline() {
	// 阶段1：生成数字
	numbers := generate(1, 2, 3, 4, 5)
	
	// 阶段2：平方
	squares := square(numbers)
	
	// 阶段3：过滤偶数
	evens := filterEven(squares)
	
	// 消费结果
	for result := range evens {
		fmt.Printf("管道结果: %d\\n", result)
	}
}

func generate(nums ...int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for _, n := range nums {
			out <- n
		}
	}()
	return out
}

func square(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			out <- n * n
		}
	}()
	return out
}

func filterEven(in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for n := range in {
			if n%2 == 0 {
				out <- n
			}
		}
	}()
	return out
}

// 4. 超时和取消模式
func timeoutAndCancel() {
	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()
	
	result := make(chan string, 1)
	
	go func() {
		// 模拟长时间运行的任务
		time.Sleep(3 * time.Second)
		result <- "任务完成"
	}()
	
	select {
	case res := <-result:
		fmt.Printf("收到结果: %s\\n", res)
	case <-ctx.Done():
		fmt.Printf("任务超时: %v\\n", ctx.Err())
	}
}

// 5. 信号量模式（限制并发数）
type Semaphore struct {
	ch chan struct{}
}

func NewSemaphore(capacity int) *Semaphore {
	return &Semaphore{
		ch: make(chan struct{}, capacity),
	}
}

func (s *Semaphore) Acquire() {
	s.ch <- struct{}{}
}

func (s *Semaphore) Release() {
	<-s.ch
}

func semaphoreExample() {
	sem := NewSemaphore(3) // 最多3个并发
	var wg sync.WaitGroup
	
	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			
			sem.Acquire()
			defer sem.Release()
			
			fmt.Printf("任务 %d 开始执行\\n", id)
			time.Sleep(time.Second)
			fmt.Printf("任务 %d 执行完成\\n", id)
		}(i)
	}
	
	wg.Wait()
}

// 6. 错误处理模式
type Result struct {
	Value interface{}
	Error error
}

func processWithErrorHandling(items []int) <-chan Result {
	results := make(chan Result)
	
	go func() {
		defer close(results)
		var wg sync.WaitGroup
		
		for _, item := range items {
			wg.Add(1)
			go func(n int) {
				defer wg.Done()
				
				// 模拟可能失败的处理
				if n%4 == 0 {
					results <- Result{Error: fmt.Errorf("处理 %d 时出错", n)}
					return
				}
				
				time.Sleep(100 * time.Millisecond)
				results <- Result{Value: n * n}
			}(item)
		}
		
		wg.Wait()
	}()
	
	return results
}

func main() {
	fmt.Println("=== Worker Pool 模式 ===")
	workerPool()
	
	fmt.Println("\\n=== 扇入扇出模式 ===")
	fanInFanOut()
	
	fmt.Println("\\n=== 管道模式 ===")
	pipeline()
	
	fmt.Println("\\n=== 超时和取消模式 ===")
	timeoutAndCancel()
	
	fmt.Println("\\n=== 信号量模式 ===")
	semaphoreExample()
	
	fmt.Println("\\n=== 错误处理模式 ===")
	items := []int{1, 2, 3, 4, 5, 6, 7, 8}
	for result := range processWithErrorHandling(items) {
		if result.Error != nil {
			fmt.Printf("错误: %v\\n", result.Error)
		} else {
			fmt.Printf("结果: %v\\n", result.Value)
		}
	}
}`,
    tags: ['go', 'concurrency', 'goroutines', 'channels', 'patterns'],
    created_at: Date.now() - 777600000, // 9天前
    updated_at: Date.now() - 32400000,  // 9小时前
    usage_count: 14,
    isFavorite: true
  }
]

// 导出函数，用于在应用中加载演示数据
export function loadDemoSnippets() {
  return demoSnippets.map(snippet => ({
    ...snippet,
    folder_id: null, // 默认不在任何文件夹中
    created_at: snippet.created_at,
    updated_at: snippet.updated_at
  }))
}

// 按语言分组的演示数据
export function getDemoSnippetsByLanguage() {
  const grouped = {}
  demoSnippets.forEach(snippet => {
    if (!grouped[snippet.language]) {
      grouped[snippet.language] = []
    }
    grouped[snippet.language].push(snippet)
  })
  return grouped
}

// 获取热门标签
export function getPopularTags() {
  const tagCount = {}
  demoSnippets.forEach(snippet => {
    snippet.tags.forEach(tag => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })
  
  return Object.entries(tagCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }))
}

export default demoSnippets