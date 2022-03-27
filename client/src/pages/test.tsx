import { h } from 'preact';

let writer: WritableStreamDefaultWriter<Uint8Array>;
let reader: ReadableStreamDefaultReader<Uint8Array>;

export const TestPage = () => {
  async function connect() {
    const port = await navigator.serial.requestPort({
      filters: [{ usbVendorId: 0x2e8a, usbProductId: 0x0005 }],
    });

    port.ondisconnect = () => {
      alert('Port disconnected');
      location.reload();
    };

    await port.open({ baudRate: 115200 });
    console.log('[SerialForwarder] Serial port opened');

    if (!port.readable || !port.writable) {
      alert('Port is not readable or writable');
      return;
    }

    reader = port.readable.getReader();
    writer = port.writable.getWriter();

    async function read() {
      console.log('[SerialForwarder] Reading');
      const { value, done } = await reader.read();
      if (done) {
        console.log('[SerialForwarder] End of file');
        return;
      }
      console.log('[SerialForwarder] Read', new TextDecoder().decode(value));
      setTimeout(() => read(), 100);
    }

    read();
  }

  return (
    <div>
      <h1>Hello</h1>
      <button onClick={connect}>Connect</button>
      <br />
      <input type='text' />
      <button
        onClick={() => {
          writer.write(new TextEncoder().encode(document.querySelector('input')?.value + '\r\n'));
        }}
      >
        Send
      </button>
    </div>
  );
};
