# Pomodoro Timer

A task management and productivity app based on the Pomodoro Technique, helping users manage their time effectively.

## Features

- Task management with time tracking
- Pomodoro timer with work and break intervals
- Task visualization with progress indication
- Simple and intuitive interface

## Development

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

## Backup Strategy

This project includes a backup system to prevent data loss during development.

### How to Create a Backup

Run the backup script using Node.js:

```bash
node backup.js
```

This will create a timestamped backup in the `backups` directory.

### Restoring from a Backup

To restore from a backup:

1. Stop the development server
2. Copy the contents from the backup folder into the root project directory
3. Run `npm install` to ensure dependencies are up to date
4. Start the development server with `npm run dev`

### Recommended Backup Schedule

- Before implementing major changes
- After completing key features
- When the application is in a stable state
- Daily during active development

## Git Strategy

To properly maintain the project with Git:

1. Initialize Git if not already done:
   ```bash
   git init
   ```

2. Create a `.gitignore` file:
   ```
   node_modules
   .next
   backups
   ```

3. Make regular commits:
   ```bash
   git add .
   git commit -m "Descriptive message about changes"
   ```

4. Create feature branches for new functionality:
   ```bash
   git checkout -b feature/new-feature-name
   ```

5. Push to remote repository:
   ```bash
   git push origin main
   ```

## Getting Started

### Prerequisites

- Node.js 18.x or later
- pnpm (recommended) or npm

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/pomodoro-timer.git
cd pomodoro-timer
```

2. Install dependencies
```bash
pnpm install
```

3. Run the development server
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Timer**
   - Click the timer circle to start/pause
   - Visual progress tracking for both Pomodoro and task time
   - Task time remaining display

2. **Tasks**
   - Add tasks with custom durations
   - Assign colors to tasks
   - Track progress
   - Edit or delete tasks

3. **Statistics**
   - View task distribution in pie chart
   - Track daily progress
   - Monitor time spent on tasks

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- UI Components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide](https://lucide.dev/) 