import Guacamole from 'guacamole-common-js';

interface Data {
  data: string;
  type: string;
}

export class Clipboard {
  protected cache: any;

  install(client: Guacamole.Client) {
    this.getLocalClipboard().then((data) => (this.cache = data));
    client.onclipboard = this.onClipboard.bind(this);

    window.addEventListener('load', this.update(client), true);
    window.addEventListener('copy', this.update(client));
    window.addEventListener('cut', this.update(client));
    window.addEventListener(
      'focus',
      (e) => {
        if (e.target === window) {
          this.update(client)();
        }
      },
      true
    );
  }

  update(client: Guacamole.Client) {
    return () => {
      this.getLocalClipboard().then((data) => {
        this.cache = data;
        this.setRemoteClipboard(client);
      });
    };
  }

  setRemoteClipboard(client: Guacamole.Client) {
    if (!this.cache) {
      return;
    }

    const stream = client.createClipboardStream(this.cache.type);

    if (typeof this.cache.data === 'string') {
      const writer = new Guacamole.StringWriter(stream as any);
      writer.sendText(this.cache.data);
      writer.sendEnd();
    } else {
      const writer = new Guacamole.BlobWriter(stream);
      writer.oncomplete = function clipboardSent() {
        writer.sendEnd();
      };
      writer.sendBlob(this.cache.data);
    }
  }

  async getLocalClipboard() {
    if (navigator.clipboard) {
      const text = await navigator.clipboard.readText();
      return {
        type: 'text/plain',
        data: text,
      };
    }
  }

  async setLocalClipboard(data: Data) {
    if (navigator.clipboard) {
      if (data.type === 'text/plain') {
        await navigator.clipboard.writeText(data.data);
      }
    }
  }

  onClipboard(stream: Guacamole.InputStream, mimetype: string) {
    if (/^text\//.exec(mimetype)) {
      const reader = new Guacamole.StringReader(stream);

      // Assemble received data into a single string
      let data = '';
      reader.ontext = (text) => {
        data += text;
      };

      // Set clipboard contents once stream is finished
      reader.onend = () => {
        this.setLocalClipboard({
          type: mimetype,
          data: data,
        });
      };
    } else {
      const reader = new Guacamole.BlobReader(stream, mimetype);
      reader.onend = () => {
        this.setLocalClipboard({
          type: mimetype,
          data: reader.getBlob(),
        });
      };
    }
  }
}
