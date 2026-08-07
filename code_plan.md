# Tiny MC Launcher - 代码架构与技术文档

## 1. 项目概述

Tiny MC Launcher 是一个用纯 C 语言编写的轻量级 Minecraft 启动器，支持 Windows、Linux、macOS 和 BSD 平台。项目采用单文件主程序结构，依赖 cJSON 库进行 JSON 解析。

## 2. 文件结构

```
/workspace/
├── tiny_mc.c      # 主程序文件 (约 4082 行)
├── cJSON.c        # JSON 解析库实现
├── cJSON.h        # JSON 解析库头文件
├── README.md      # 用户文档
└── code_plan.md   # 技术文档 (本文件)
```

## 3. 核心架构

### 3.1 平台检测与抽象

程序通过预处理器宏实现跨平台支持：

```c
// Windows API 兼容层
#if defined(_WIN32) || defined(_WIN64) || defined(__REACTOS__)
    #define PLATFORM_WINAPI
    // 包含 Windows 头文件和 WinHTTP
#elif defined(__APPLE__) && defined(__MACH__)
    #define PLATFORM_POSIX
    #define PLATFORM_MACOS
    // 包含 POSIX 头文件和 libcurl
#elif defined(__linux__)
    #define PLATFORM_POSIX
    #define PLATFORM_LINUX
    // 包含 POSIX 头文件和 libcurl
#elif defined(__FreeBSD__) || ...
    #define PLATFORM_POSIX
    #define PLATFORM_BSD
#endif
```

**平台抽象宏**:
- `PATH_SEP` / `PATH_SEP_STR`: 路径分隔符 (`\` vs `/`)
- `EXE_EXT`: 可执行文件扩展名 (`.exe` vs 空)
- `NATIVE_SUFFIX`: 原生库后缀 (`natives-windows`/`natives-macos`/`natives-linux`)

### 3.2 网络层抽象

网络请求根据平台使用不同实现：

| 平台 | HTTP 实现 |
|------|----------|
| Windows | WinHTTP API |
| POSIX | libcurl |

**核心函数**:
- `http_post()`: POST 请求 (用于认证)
- `http_get()`: GET 请求 (获取 JSON 数据)
- `http_get_file()`: 文件下载 (带进度条)

### 3.3 数据结构

#### JavaInfo (Java 信息)
```c
typedef struct {
    char path[MAX_PATH_LEN];      // Java 路径
    char version[32];             // 版本号
    int major;                    // 主版本
    int valid;                    // 是否有效
} JavaInfo;
```

#### AccountInfo (账户信息)
```c
typedef struct {
    char username[64];            // 用户名
    char email[64];               // 邮箱
    char type[16];                // 类型 (offline/external/official)
    char server[128];             // 认证服务器
    char password[64];            // 密码
    char accessToken[128];        // 访问令牌
    char uuid[64];                // UUID
    int is_default;               // 是否默认账户
    char player_ids[MAX_PLAYER_IDS][64];  // 玩家 ID 列表
    int player_id_count;          // 玩家 ID 数量
} AccountInfo;
```

#### VersionInfo (版本信息)
```c
typedef struct {
    char id[64];                  // 版本 ID
    char inheritsFrom[64];        // 继承自 (用于模组加载器)
    char mainClass[128];          // 主类
    char assets[64];              // 资源版本
    char assetIndex[64];          // 资源索引
    char assetIndexUrl[512];      // 资源索引 URL
    int assetIndexTotalSize;      // 资源总大小
    char jar[64];                 // JAR 文件名
    char client_url[512];         // 客户端下载 URL
    int java_major;               // 所需 Java 主版本
    char* libraries[MAX_LIBS];    // 库列表
    int lib_count;                // 库数量
    char* natives[MAX_LIBS];      // 原生库列表
    int native_count;             // 原生库数量
    char* jvm_args[MAX_LIBS];     // JVM 参数
    int jvm_arg_count;            // JVM 参数数量
    char* game_args[MAX_LIBS];    // 游戏参数
    int game_arg_count;           // 游戏参数数量
} VersionInfo;
```

#### DownloadParams (下载参数)
```c
typedef struct {
    char version_type[32];        // 版本类型
    char version[64];             // 版本号
    char mod_loader[32];          // 模组加载器
    char mod_loader_version[64];  // 模组加载器版本
    int list_versions;            // 列出版本
    int list_mod_loaders;         // 列出模组加载器
} DownloadParams;
```

#### StartParams (启动参数)
```c
typedef struct {
    char version[64];             // 版本
    char account_type[16];        // 账户类型
    char account_email[128];      // 账户邮箱
    char account_pass[128];       // 账户密码
    char account_server[256];     // 认证服务器
    char java_home[MAX_PATH_LEN]; // Java 路径
    int memory_mb;                // 内存大小
    char extra_jvm_args[1024];    // 额外 JVM 参数
    char extra_game_args[1024];   // 额外游戏参数
    char pre_command[1024];       // 启动前命令
    char window_title[256];       // 窗口标题
    int user_type_index;          // 账户索引
    char authlib_injector[512];   // authlib-injector 路径
} StartParams;
```

## 4. 核心模块

### 4.1 配置管理模块

**功能**: 读写 INI 格式配置文件

**核心函数**:
- `get_config_path()`: 获取配置文件路径
- `write_config()`: 写入配置项
- `read_config()`: 读取配置项
- `clear_config()`: 清除配置

**Windows 实现**: 使用 `WritePrivateProfileStringA` / `GetPrivateProfileStringA`
**POSIX 实现**: 需要手动解析 INI 文件 (代码中主要为 Windows 实现)

### 4.2 Java 管理模块

**功能**: 扫描和管理系统中安装的 Java 版本

**核心函数**:
- `auto_scan_java()`: 自动扫描 Java 安装
- `get_java_version()`: 获取 Java 版本
- `parse_java_major_version()`: 解析 Java 主版本号
- `check_java_valid()`: 验证 Java 是否可用
- `select_java_interactive()`: 交互式选择 Java
- `select_java_by_major()`: 按主版本选择 Java

**扫描路径 (Windows)**:
- `C:\Program Files\Java`
- `C:\Program Files (x86)\Java`
- `C:\Program Files\Eclipse Adoptium`
- `C:\Java`

### 4.3 账户管理模块

**功能**: 管理 Minecraft 账户，支持多种登录方式

**登录类型**:
1. **离线模式**: 无需认证，本地创建账户
2. **外置登录**: 使用 authlib-injector 兼容的第三方认证服务器
3. **正版登录**: 预留 (Microsoft OAuth)

**核心函数**:
- `yggdrasil_authenticate()`: Yggdrasil 协议认证
- `save_account()`: 保存账户到配置
- `select_account_interactive()`: 交互式选择账户
- `list_accounts()`: 列出所有账户

**认证流程**:
1. 生成随机 client_token
2. 构建认证 JSON 请求
3. POST 到认证服务器
4. 解析响应获取 accessToken 和 UUID
5. 处理多角色选择 (如有)

### 4.4 版本解析模块

**功能**: 解析 Minecraft 版本 JSON 文件

**核心函数**:
- `parse_version_json()`: 解析版本 JSON
- `resolve_version()`: 解析版本继承链
- `build_classpath()`: 构建类路径

**JSON 解析内容**:
- `mainClass`: 游戏主类
- `inheritsFrom`: 父版本 (用于 Forge/Fabric 等)
- `libraries`: 依赖库列表
- `rules`: 平台规则过滤
- `arguments.jvm/game`: JVM 和游戏参数
- `downloads.client.url`: 客户端 JAR URL
- `assetIndex`: 资源索引信息

### 4.5 文件下载模块

**功能**: 下载游戏文件、库和资源

**核心函数**:
- `verify_and_download_files()`: 验证并下载所有必要文件
- `create_parent_dirs()`: 创建父目录
- `file_exists()`: 检查文件是否存在

**下载内容**:
1. 版本 JSON
2. 客户端 JAR
3. 依赖库
4. 原生库 (natives)
5. 资源文件 (assets)

**完整性验证**: 使用 SHA1 哈希校验

### 4.6 命令构建模块

**功能**: 构建 Minecraft 启动命令

**核心函数**:
- `build_command()`: 构建完整的 Java 启动命令

**命令组成**:
```bash
<java_exe> <jvm_args> -cp <classpath> <mainClass> <game_args>
```

**关键参数**:
- `-Xmx/Xms`: 内存设置
- `-Djava.library.path`: 原生库路径
- `-cp`: 类路径 (所有库文件)
- 主类和游戏参数

### 4.7 进程管理模块

**功能**: 启动和管理游戏进程

**核心函数**:
- `start_game()`: 启动游戏
- `exec_cmd()`: 执行命令并捕获输出

**Windows 实现**: 使用 `CreateProcessA` / `WaitForSingleObject`
**POSIX 实现**: 使用 `fork()` / `exec()` / `waitpid()`

### 4.8 模组加载器模块

**功能**: 下载和安装 Forge、Fabric、Quilt、NeoForge、Liteloader

**支持的模组加载器**:
- **Forge**: 从 maven.minecraftforge.net 获取
- **Fabric**: 从 meta.fabricmc.net 获取
- **Quilt**: 从 meta.quiltmc.org 获取
- **NeoForge**: 从 maven.neoforged.net 获取
- **Liteloader**: 从 repo.mumfrey.com 获取

**核心函数**:
- `download_and_install_mod_loader()`: 下载并安装模组加载器
- `list_mod_loader_versions()`: 列出模组加载器版本
- `get_modloader()`: 从版本名识别模组加载器

## 5. 命令行解析

### 5.1 参数解析器

```c
int parse_args(char* cmd, char** argv, int max)
```

支持引号包裹的参数，将命令字符串解析为 argc/argv 格式。

### 5.2 命令分发

主函数中的命令分发逻辑:

```c
if (str_cmp(argv[1], "-help") == 0) show_help();
else if (str_cmp(argv[1], "-ver") == 0) print_version();
else if (str_cmp(argv[1], "-mcpath") == 0) set_mc_path(argv[2]);
else if (str_cmp(argv[1], "-lv") == 0) list_mc_versions();
else if (str_cmp(argv[1], "-setver") == 0) set_default_ver(argv[2]);
else if (str_cmp(argv[1], "-j") == 0) handle_java_cmd(argc, argv);
else if (str_cmp(argv[1], "-u") == 0) handle_user_cmd(argc, argv);
else if (str_cmp(argv[1], "-set") == 0) set_launch_params(argc, argv);
else if (str_cmp(argv[1], "-start") == 0) start_mc(argc, argv);
else if (str_cmp(argv[1], "-s") == 0) quick_start();
else if (str_cmp(argv[1], "-download") == 0) download_mc(argc, argv);
```

## 6. 安全特性

### 6.1 字符串操作安全

提供安全的字符串操作函数防止缓冲区溢出:

```c
void safe_str_cpy(char* dest, size_t dest_size, const char* src);
void safe_str_cat(char* dest, size_t dest_size, const char* src);
```

### 6.2 路径处理

- 移除路径中的引号
- 平台特定的路径分隔符处理
- 目录创建时逐级检查

## 7. 依赖管理

### 7.1 cJSON 库

用于解析所有 JSON 数据:
- 版本清单 JSON
- 版本详情 JSON
- 认证响应 JSON
- 模组加载器元数据

**主要 API 使用**:
- `cJSON_Parse()`: 解析 JSON 字符串
- `cJSON_GetObjectItem()`: 获取对象字段
- `cJSON_GetArraySize()`: 获取数组大小
- `cJSON_GetArrayItem()`: 获取数组元素
- `cJSON_PrintUnformatted()`: 序列化 JSON

### 7.2 zlib 库

用于解压 JAR 文件中的内容:
- 解压原生库
- 读取 JAR 内文件

### 7.3 平台特定依赖

| 平台 | HTTP 库 | 其他依赖 |
|------|--------|---------|
| Windows | WinHTTP | kernel32, user32, advapi32 |
| Linux/macOS/BSD | libcurl | pthread |

## 8. 常量定义

```c
#define MAX_PATH_LEN 260        // 最大路径长度
#define MAX_JAVA 8              // 最大 Java 数量
#define MAX_ACCOUNTS 8          // 最大账户数量
#define MAX_ARGC 32             // 最大参数数量
#define MAX_CLASSPATH 65536     // 最大类路径长度
#define MAX_LIB_PATH 512        // 最大库路径长度
#define MAX_LIBS 1024           // 最大库数量
#define MAX_PLAYER_IDS 5        // 最大玩家 ID 数量
#define CLIENT_TOKEN_LEN 33     // 客户端令牌长度

#define MC_BASE_URL "https://launchermeta.mojang.com"
#define LIBRARIES_URL "https://libraries.minecraft.net"
#define AUTHLIB_URL "https://authlib-injector.github.io/..."
```

## 9. 工作流程

### 9.1 启动流程

```
1. 初始化
   ├── 获取启动器目录
   ├── 解析命令行参数
   └── 加载配置文件

2. 环境检测
   ├── 扫描已安装 Java
   ├── 读取已保存账户
   └── 检测已下载版本

3. 命令执行
   ├── 根据参数执行对应命令
   └── 返回结果
```

### 9.2 游戏启动流程

```
1. 准备阶段
   ├── 选择/验证版本
   ├── 选择账户
   ├── 确定 Java 路径
   └── 下载缺失文件

2. 构建命令
   ├── 解析版本 JSON
   ├── 构建类路径
   ├── 添加 JVM 参数
   └── 添加游戏参数

3. 启动进程
   ├── 执行前置命令 (如有)
   ├── 创建游戏进程
   └── 等待/监控进程
```

### 9.3 版本下载流程

```
1. 获取版本列表
   └── 下载版本清单 JSON

2. 选择版本
   └── 下载版本详情 JSON

3. 解析依赖
   ├── 解析库列表
   ├── 解析原生库
   └── 解析资源索引

4. 下载文件
   ├── 下载客户端 JAR
   ├── 下载所有库
   ├── 下载原生库
   └── 下载资源文件

5. 验证完整性
   └── SHA1 哈希校验
```

## 10. 错误处理

- 网络请求失败时返回 NULL 或 0
- 文件操作检查返回值
- JSON 解析检查有效性
- 关键操作前进行存在性检查

## 11. 限制与已知问题

1. **配置文件**: POSIX 平台的 INI 文件读写未完全实现
2. **正版登录**: Microsoft OAuth 登录尚未实现
3. **内存管理**: 部分动态分配的内存可能未释放
4. **路径长度**: Windows 限制为 260 字符
5. **并发下载**: 目前为串行下载，无多线程优化

## 12. 扩展建议

1. **图形界面**: 可基于此核心添加 GUI 前端
2. **插件系统**: 支持自定义启动器插件
3. **Mod 管理**: 集成 Mod 下载和管理
4. **多实例**: 支持多开和实例隔离
5. **自动更新**: 启动器自身更新功能
