###### @LogicsSoldier's
# Publish Folder

A simple Express.js application to quickly publish and browse folder contents via web interface. View files and folders in a clean interface and download files with a single click. It's only 300 lines of code and 2 depedencies (you really can read it.)

<img width="625" height="372" alt="image" src="https://github.com/user-attachments/assets/764db0bc-6ed8-455e-a417-d65b32f5fc97" />

## Features

- 📁 Browse folders and files with a clean web interface
- 📥 Download files with one click
- 🎨 Responsive design that works on mobile and desktop
- 🔒 Security: prevents access outside the published folder
- 📊 Shows file sizes and modification dates
- 🚀 Fast and lightweight

## Installation

```bash
# if you trust me and want to add the command to path so you can use it anywhere
# (whole package -dependecies is only 300 lines of code.. only 2 dependecies)
npm install -g @logicssoldier/publish-folder
# OR --------
# can also download the package from npm or github and run from the folder without needing admin privelage
npm pack @logicssoldier/publish-folder
# pick whichever you're comfortable with!

```

## Usage

### Publish a specific folder:

```bash
# if global
publish-folder /path/to/folder
# otherwise find npm package and..
node server.js /path/to/folder
```

### Custom port:

```bash
PORT=8080 npm start
```

## How It Works

1. Cd into your chose directory and start the server with `publish-folder`
2. Open your browser to `http://localhost:3000`
3. Browse folders by clicking on them
4. Download files by clicking on them
5. Use the breadcrumb navigation or ".." to go back
6. click the download button to download the entire directory zipped up

## Examples

Publish your Documents folder:
```bash
node server.js ~/Documents
```

Publish current directory:
```bash
node server.js
```

Publish and use custom port:
```bash
PORT=8080 node server.js /path/to/folder
```

## Security

The application includes path traversal protection to ensure users cannot access files outside the published folder.

## License

MIT
