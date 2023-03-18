import { Application } from "@hotwired/stimulus";

const application = Application.start();

// Configure Stimulus development experience
application.debug = false;
Object.assign(window, { Stimulus: application });

export { application };
