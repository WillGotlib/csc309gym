const wrappedConsoleLog = (...args) => {
    console.log('\n' + '-'.repeat(50));
    console.log(...args);
}

export default wrappedConsoleLog;