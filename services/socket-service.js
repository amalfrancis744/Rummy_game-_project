async function onEvent1(socket, data) {
    // eslint-disable-next-line no-console
    console.log('onEvent1', socket.id, data);
}

module.exports = {
    onEvent1,
};
