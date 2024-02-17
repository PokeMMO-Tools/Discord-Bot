process.on('unhandledRejection', (reason, p) => {
    console.log('\n\n\n\n\n=== unhandled Rejection ==='.toUpperCase().yellow.dim);
    console.log('Reason: ', reason.stack ? String(reason.stack).gray : String(reason).gray);
    console.log('=== unhandled Rejection ===\n\n\n\n\n'.toUpperCase().yellow.dim);
});
process.on("uncaughtException", (err, origin) => {
    console.log('\n\n\n\n\n\n=== uncaught Exception ==='.toUpperCase().yellow.dim);
    console.log('Exception: ', err.stack ? err.stack : err)
    console.log('=== uncaught Exception ===\n\n\n\n\n'.toUpperCase().yellow.dim);
})
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('=== uncaught Exception Monitor ==='.toUpperCase().yellow.dim);
});
process.on('beforeExit', (code) => {
    console.log('\n\n\n\n\n=== before Exit ==='.toUpperCase().yellow.dim);
    console.log('Code: ', code);
    console.log('=== before Exit ===\n\n\n\n\n'.toUpperCase().yellow.dim);
});
process.on('exit', (code) => {
    console.log('\n\n\n\n\n=== exit ==='.toUpperCase().yellow.dim);
    console.log('Code: ', code);
    console.log('=== exit ===\n\n\n\n\n'.toUpperCase().yellow.dim);
});