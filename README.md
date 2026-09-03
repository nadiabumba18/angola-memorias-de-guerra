# Angola — Memórias de Guerra

Projeto único: campanha web de 20 níveis + backend multiplayer.

## O que já está preparado
- Servidor Node.js com WebSocket para presença, salas, chat e sinalização WebRTC.
- Contas locais com palavras-passe armazenadas com hash/salt.
- Progresso por jogador.
- Sistema de amigos básico.
- Sinalização para chamadas de voz WebRTC.
- Cliente web e os dois áudios da abertura/final.

## Importante
O backend precisa ser executado em um serviço de hospedagem que mantenha conexões WebSocket. O Netlify pode hospedar a parte web e funções serverless, mas o servidor WebSocket precisa de uma infraestrutura própria/compatível.

## Executar localmente
```bash
npm install
npm start
```
Depois abrir `http://localhost:8080`.

## Produção
Defina `PORT` e publique este diretório em um ambiente que aceite Node.js e WebSocket. Depois altere o cliente para usar `wss://SEU-DOMINIO`.
