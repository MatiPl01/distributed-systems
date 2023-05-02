import Logger from './Logger.js';

export default class InputParser {
  constructor(config) {
    this.config = config;
  }

  parseInput(input) {
    const [command, arg, ...options] = input.split(/\s+/g);

    if (!this.validateCommand(command) || !this.validateArg(command, arg)) {
      return null;
    }
    const parsedOptions = this.parseOptions(command, arg, options);

    if (!this.validateOptions(command, arg, parsedOptions)) return null;

    return {
      command,
      arg,
      options: parsedOptions
    };
  }

  validateCommand(command) {
    if (!this.config[command]) {
      Logger.error(`Command '${command}' is not supported.`);
      return false;
    }
    return true;
  }

  validateArg(command, arg) {
    if (!arg) {
      Logger.error(`Command '${command}' requires an argument.`);
      return false;
    }
    if (
      !this.config[command]?.args === '*' &&
      this.config[command]?.args.some(arg => arg.value === arg)
    ) {
      Logger.error(
        `Argument '${arg}' is not supported for command '${command}'.`
      );
      return false;
    }
    return true;
  }

  parseOptions(command, arg, options) {
    const parsedOptions = {};

    options?.forEach(option => {
      const [key, value] = option.replace('--', '').split('=');

      // Parse value
      let parsedValue = value;
      const parseOptions = [
        ...(this.config[command]?.options?.[arg] || []),
        ...(this.config[command]?.options?.shared || [])
      ].find(option => option.name === key);

      if (!isNaN(+value)) {
        parsedValue = Number(value);
      } else if (parseOptions?.type === 'array' && /^(.+,)*.+$/.test(value)) {
        parsedValue = value.split(',');
      }

      parsedOptions[key] = parsedValue;
    });

    return parsedOptions;
  }

  validateOptions(command, arg, parsedOptions) {
    const validOptions = [
      ...(this.config[command]?.options?.[arg] || []),
      ...(this.config[command]?.options?.shared || [])
    ];

    if (!validOptions.length && Object.values(parsedOptions).length) {
      Logger.error('This command does not support any options.');
    }

    const requiredOptions = validOptions.filter(option => !option.optional);
    for (const option of requiredOptions) {
      if (!parsedOptions[option.name]) {
        Logger.error(`Option '${option.name}' is required.`);
        return false;
      }
    }

    // Check if all options are valid
    for (const [option, value] of Object.entries(parsedOptions)) {
      // Find corresponding option in validOptions
      const validOption = validOptions.find(
        validOption => validOption.name === option
      );

      if (!validOption) {
        Logger.error(`Option '${option}' is not supported.`);
        return false;
      }

      // Check if option value is valid
      // number
      if (validOption.type === 'number' && isNaN(value)) {
        Logger.error(`Option '${option}' must be a number.`);
        return false;
      }
      // array
      if (validOption.type === 'array' && !Array.isArray(value)) {
        Logger.error(`Option '${option}' must be an array.`);
        return false;
      }
    }

    return true;
  }
}
