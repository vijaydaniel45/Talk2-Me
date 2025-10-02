module.exports.runtime = {
  handler: async function ({ command }) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      this.introspect(`${callerId} executing command: ${command}`);

      const fetch = (await import("node-fetch")).default;
      const response = await fetch(
        `http://localhost:8000/execute?command=${encodeURIComponent(command)}`
      );

      const data = await response.json();
      return JSON.stringify(data);
    } catch (e) {
      this.introspect(`${callerId} failed: ${e.message}`);
      this.logger(`${callerId} error`, e.message);
      return `The tool failed: ${e.message}`;
    }
  }
};

