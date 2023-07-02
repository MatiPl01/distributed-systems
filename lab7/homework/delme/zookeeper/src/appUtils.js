import { exec } from "child_process";

// Function to open the app
export function openApp(appName) {
  exec(`open -a "${appName}"`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    console.log("🎉 Graphical application started!");
  });
}

// Function to kill the app
export function killApp(appName) {
  exec(`pkill "${appName}"`, (err, stdout, stderr) => {
    if (err) {
      console.error(`Error: ${err.message}`);
      return;
    }

    if (stderr) {
      console.error(`stderr: ${stderr}`);
      return;
    }

    console.log("✨ Graphical application closed!");
  });
}
