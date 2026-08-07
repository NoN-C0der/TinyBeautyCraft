# Tiny MC Launcher

一个轻量级的跨平台 Minecraft 启动器，使用纯 C 语言编写。

## 功能特性

- **跨平台支持**: Windows/ReactOS、Linux、macOS、BSD
- **版本管理**: 支持下载和管理多个 Minecraft 版本
- **模组加载器**: 支持 Forge、Fabric、Quilt、NeoForge、Liteloader
- **账户管理**: 
  - 离线模式账户
  - 外置登录 (authlib-injector)
  - 正版登录 (预留)
- **Java 管理**: 自动扫描已安装的 Java 版本
- **自定义启动参数**: 支持 JVM 参数、内存设置、游戏参数等
- **命令行界面**: 完整的命令行操作支持

## 编译说明

### Windows/ReactOS
```bash
gcc -m32 tiny_mc.c cJSON.c -o mc.exe -lkernel32 -luser32 -ladvapi32 -lwinhttp -static -mconsole
```

### Linux
```bash
gcc tiny_mc.c cJSON.c -o mc -lcurl
```

### macOS
```bash
clang tiny_mc.c cJSON.c -o mc -lcurl
```

### BSD
```bash
clang tiny_mc.c cJSON.c -o mc -lcurl
```

## 依赖项

- **Windows**: WinHTTP API (系统自带)
- **Linux/macOS/BSD**: libcurl
- **所有平台**: zlib (用于 JAR 文件解压)

## 快速开始

### 基本命令

```bash
# 显示帮助
./mc -help

# 显示版本
./mc -ver

# 快速启动 (使用默认设置)
./mc -s

# 交互式启动
./mc -start
```

### 配置 Minecraft 目录

```bash
# 设置 Minecraft 目录
./mc -mcpath "C:\Users\YourName\AppData\Roaming\.minecraft"

# 设置默认版本
./mc -setver 1.20.1

# 列出可用版本
./mc -lv
```

### Java 管理

```bash
# 自动扫描 Java
./mc -j -au

# 列出所有 Java
./mc -j -list
```

### 账户管理

```bash
# 添加离线账户
./mc -u -l offline Steve

# 添加外置登录账户
./mc -u -l external https://example.com email@example.com password

# 列出账户
./mc -u -list
```

### 高级启动

```bash
./mc -start -ver 1.20.1 -account offline,Steve -mem 4G -jvm_args "-Doptifine=true"
```

### 下载游戏版本和模组加载器

```bash
# 列出可用版本
./mc -download -ver_list release

# 下载特定版本
./mc -download -ver release 1.20.1

# 列出模组加载器版本
./mc -download -mod_loader_list Fabric

# 安装模组加载器
./mc -download -mod_loader Fabric 0.15.0
```

## 命令行参数详解

### 核心命令
| 参数 | 说明 |
|------|------|
| `-help` | 显示帮助信息 |
| `-ver` | 显示版本信息 |

### Minecraft 路径管理
| 参数 | 说明 |
|------|------|
| `-mcpath <path>` | 设置 Minecraft 目录 |
| `-lv` | 列出 MC 版本 (含模组加载器信息) |
| `-setver <ver>` | 设置默认版本 |

### Java 管理
| 参数 | 说明 |
|------|------|
| `-j -au` | 自动扫描 Java |
| `-j -list` | 列出所有 Java |

### 账户管理
| 参数 | 说明 |
|------|------|
| `-u -l offline <username>` | 添加离线账户 |
| `-u -l external <api> <email> <password>` | 添加外置登录账户 |
| `-u -list` | 列出账户 |

### 启动设置
| 参数 | 说明 |
|------|------|
| `-set memory <Xms/Xmx>` | 设置内存 |
| `-set memory auto` | 自动内存 |
| `-set jvm <args>` | 自定义 JVM 参数 |

### 启动游戏
| 参数 | 说明 |
|------|------|
| `-start` | 交互式启动 |
| `-start [options]` | 高级启动选项 |
| `-s` | 快速启动 (默认设置) |
| `-printstart <ver>` | 导出启动脚本 |

### 下载
| 参数 | 说明 |
|------|------|
| `-download -ver <type> <ver>` | 下载版本 |
| `-download -mod_loader <loader> [ver]` | 安装模组加载器 |
| `-download -ver_list <type>` | 列出可用版本 |
| `-download -mod_loader_list <loader>` | 列出模组加载器版本 |

## 高级启动选项

```bash
-start -ver <name>                    # 指定版本
-start -account [type,email,pass,server]  # 账户信息
-start -usertype <index>              # 使用指定索引的账户
-start -java_home <path>              # Java 安装路径
-start -authlib [path]                # authlib-injector jar 路径
-start -mem <size>                    # 内存大小 (如 2048M, 2G)
-start -jvm_args <args>               # 额外 JVM 参数
-start -game_args <args>              # 额外游戏参数
-start -pre_command <cmd>             # 启动前执行的命令
```

## 配置文件

配置文件 `mc_config.ini` 存储在启动器目录中，包含:
- 默认 Java 路径
- 默认 Minecraft 版本
- JVM 参数
- 账户信息

## 许可证

MIT License  
Copyright (c) 2026 qwq672

## 第三方库

- **cJSON**: JSON 解析库 (MIT License)
- **zlib**: 压缩库
- **libcurl**: HTTP 客户端库 (仅 POSIX 平台)
