pipeline {
	agent any

	environment {
		NPM_REGISTRY = 'https://registry.npmjs.org/'
		BUILD_DIR = 'dist'
		DEPLOY_PATH = '/var/www/html'
	}

	options {
		buildDiscarder(logRotator(numToKeepStr: '10'))
		timeout(time: 30, unit: 'MINUTES')
		timestamps()
	}

	stages {
		stage('Preparation') {
			steps {
				echo 'Preparing environment...'
				script {
					// 检查并安装必要的工具
					sh '''
					# 更新包管理器
					apt-get update

					# 安装 zip（如果未安装）
					if ! command -v zip &> /dev/null; then
						echo "Installing zip..."
						apt-get install -y zip unzip
					fi

					# 检查并安装 Node.js
					if ! command -v node &> /dev/null; then
						echo "Node.js not found. Installing Node.js 18..."
						# 安装必要的依赖
						apt-get install -y curl gnupg
						# 添加 NodeSource 仓库
						curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
						# 安装 Node.js
						apt-get install -y nodejs
						echo "Node.js 18 installed successfully"
					else
						echo "Node.js is already installed"
					fi

					# 验证工具安装
					echo "Installed tools:"
					zip -v
					unzip -v
					'''

					// 验证安装
					sh 'node --version'
					sh 'npm --version'

					// 清理工作目录（保留 package-lock.json 以使用 npm ci）
					sh 'rm -rf node_modules || true'

					// 设置 npm 镜像源（可选，使用国内镜像加速）
					// sh 'npm config set registry https://registry.npmmirror.com/'
				}
			}
		}

		stage('Install Dependencies') {
			steps {
				echo 'Installing dependencies...'
				script {
					// 检查是否存在 package-lock.json
					if (fileExists('package-lock.json')) {
						echo 'Using npm ci for faster, reliable builds'
						sh 'npm ci --prefer-offline --no-audit'
					} else {
						echo 'No package-lock.json found, using npm install'
						sh 'npm install --no-audit'
						// 可选：生成 lockfile 以供后续构建使用
						// sh 'npm shrinkwrap'
					}
				}
			}
		}

		stage('Code Quality') {
			parallel {
				stage('Linting') {
					steps {
						echo 'Running ESLint...'
						sh 'npm run lint'
					}
				}
				stage('Type Check') {
					steps {
						echo 'Running TypeScript type check...'
						sh 'npx tsc --noEmit'
					}
				}
			}
		}

		stage('Build') {
			steps {
				echo 'Building application...'
				script {
					// 构建生产版本
					sh 'npm run build'

					// 检查构建产物
					sh "ls -la ${BUILD_DIR}/"

					// 打包构建产物为 zip
					sh """
					cd ${BUILD_DIR}
					zip -r ../frontend-build-${BUILD_NUMBER}.zip .
					cd ..
					ls -la frontend-build-${BUILD_NUMBER}.zip
					"""

					// 归档 zip 制品
					archiveArtifacts artifacts: 'frontend-build-*.zip', fingerprint: true
				}
			}
		}

		stage('Test') {
			steps {
				echo 'Running tests...'
				script {
					try {
						// 如果有测试，运行测试
						// sh 'npm run test'
						echo 'No tests configured yet. Skipping test stage.'
					} catch (Exception e) {
						currentBuild.result = 'UNSTABLE'
						echo 'Tests failed or not configured'
					}
				}
			}
		}

		stage('Security Scan') {
			steps {
				echo 'Running security scan...'
				script {
					try {
						// 检查依赖项漏洞
						sh 'npm audit --audit-level=high'
					} catch (Exception e) {
						currentBuild.result = 'UNSTABLE'
						echo 'Security vulnerabilities found'
					}
				}
			}
		}

		stage('Deploy') {
			when {
				anyOf {
					branch 'master'
					branch 'main'
					branch pattern: "release/.*", comparator: "REGEXP"
				}
			}
			steps {
				echo 'Deploying to production...'
				script {
					// 使用 zip 文件部署
					sh """
					# 解压到部署目录
					mkdir -p ${DEPLOY_PATH}
					unzip -o frontend-build-${BUILD_NUMBER}.zip -d ${DEPLOY_PATH}/

					# 验证部署
					ls -la ${DEPLOY_PATH}/
					"""

					// 其他部署方式示例：
					// 1. 使用 rsync 部署
					// sh "rsync -avz --delete ${BUILD_DIR}/ user@server:${DEPLOY_PATH}/"

					// 2. 传输 zip 到远程服务器
					// sh "scp frontend-build-${BUILD_NUMBER}.zip user@server:/tmp/"
					// sh "ssh user@server 'unzip -o /tmp/frontend-build-${BUILD_NUMBER}.zip -d ${DEPLOY_PATH}/'"

					// 3. Docker 部署
					// sh 'docker build -t frontend-app .'
					// sh 'docker push your-registry/frontend-app:${BUILD_NUMBER}'

					echo 'Deployment completed!'
				}
			}
		}
	}

	post {
		always {
			echo 'Cleaning up workspace...'
			cleanWs()
		}

		success {
			echo '✅ Pipeline completed successfully!'
			// 生成构建报告
			sh 'echo "Build completed successfully" > build-report.txt'
			archiveArtifacts artifacts: 'build-report.txt', allowEmptyArchive: true
		}

		failure {
			echo '❌ Pipeline failed!'
			// 发送失败通知（需配置邮件插件）
			// mail to: 'team@example.com',
			//     subject: "Build Failed: ${env.JOB_NAME} - ${env.BUILD_NUMBER}",
			//     body: "Build failed. Check console output at ${env.BUILD_URL}"
		}

		unstable {
			echo '⚠️ Pipeline completed with warnings!'
		}

		aborted {
			echo '⏹️ Pipeline was aborted!'
		}
	}
}