process.on('unhandledRejection', (reason, p) => {
    console.log('\n\n\n\n\n=== unhandled Rejection ==='.toUpperCase());
    console.log('Reason: ', reason.stack ? String(reason.stack) : String(reason));
    console.log('=== unhandled Rejection ===\n\n\n\n\n'.toUpperCase());
});
process.on("uncaughtException", (err, origin) => {
    console.log('\n\n\n\n\n\n=== uncaught Exception ==='.toUpperCase());
    console.log('Exception: ', err.stack ? err.stack : err)
    console.log('=== uncaught Exception ===\n\n\n\n\n'.toUpperCase());
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('=== uncaught Exception Monitor ==='.toUpperCase());
});
process.on('beforeExit', (code) => {
    console.log('\n\n\n\n\n=== before Exit ==='.toUpperCase());
    console.log('Code: ', code);
    console.log('=== before Exit ===\n\n\n\n\n'.toUpperCase());
});
process.on('exit', (code) => {
    console.log('\n\n\n\n\n=== exit ==='.toUpperCase());
    console.log('Code: ', code);
    console.log('=== exit ===\n\n\n\n\n'.toUpperCase());
});