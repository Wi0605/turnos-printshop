require('dotenv').config();
const ftp = require('basic-ftp');
const path = require('path');
const fs = require('fs');

async function deploy() {
  const host = process.env.FTP_HOST;
  const user = process.env.FTP_USER;
  const password = process.env.FTP_PASSWORD;
  const port = parseInt(process.env.FTP_PORT, 10) || 21;
  const remoteDir = process.env.FTP_REMOTE_DIR || '/';
  const secure = process.env.FTP_SECURE === 'true';

  if (!host || !user || !password) {
    console.error('\n❌ ERROR: Faltan credenciales de FTP.');
    console.error('👉 Asegúrate de crear el archivo .env con:');
    console.error('   FTP_HOST=...');
    console.error('   FTP_USER=...');
    console.error('   FTP_PASSWORD=...');
    console.error('   FTP_REMOTE_DIR=...');
    console.error('\nPuedes ver un ejemplo en .env.example\n');
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log(`\n📡 Conectando a ${host}:${port} como "${user}"...`);
    await client.access({
      host,
      port,
      user,
      password,
      secure
    });

    console.log(`✅ Conexión establecida.`);
    console.log(`📁 Navegando a directorio remoto: ${remoteDir}`);
    await client.ensureDir(remoteDir);

    console.log(`\n🚀 Subiendo archivos del proyecto a ${remoteDir}...`);

    // Archivos individuales de la raíz a subir
    const rootFiles = ['server.js', 'package.json', 'package-lock.json', 'Dockerfile', 'docker-compose.yml'];
    for (const file of rootFiles) {
      const localFilePath = path.join(__dirname, file);
      if (fs.existsSync(localFilePath)) {
        console.log(` ⬆️ Subiendo ${file}...`);
        await client.uploadFrom(localFilePath, file);
      }
    }

    // Subir carpeta public/ completa
    const publicPath = path.join(__dirname, 'public');
    if (fs.existsSync(publicPath)) {
      console.log(` ⬆️ Sincronizando carpeta public/ completa...`);
      await client.uploadFromDir(publicPath, 'public');
    }

    console.log(`\n🎉 ¡Despliegue manual completado con éxito en tu servidor! 🎉\n`);
  } catch (err) {
    console.error('\n❌ Error durante el despliegue:', err.message);
    process.exit(1);
  } finally {
    client.close();
  }
}

deploy();
