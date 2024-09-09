//
// Edit these to your own local instances
const WHISPR = 'http://localhost/whispr/audio/transcriptions' 
const OLLAMA = 'http://localhost:11434/api/chat'

// Example address book
const book = {
  bob : {
    btc : "bcrt1qrfd2ujntu7la5vjqpjr69u8tc8rl6fxvx6hrzm",
  },
  alice : { 
    btc: "bcrt1q7mm7seyccvf4dyc2je97zumh4aes7xhgetwc6m",
    eth: { 
      usdt : "0x9ede22b627388b5db43c3488f27480b45d22d238",
    }
  },
}

function renderAddressBook(book) {
  const container = document.createElement('div');
  container.className = 'address-book';

  for (const [name, addresses] of Object.entries(book)) {
    const personElement = document.createElement('div');
    personElement.className = 'person';

    const nameElement = document.createElement('h3');
    nameElement.textContent = name;
    personElement.appendChild(nameElement);

    const addressList = document.createElement('ul');
    renderAddresses(addresses, addressList);
    personElement.appendChild(addressList);

    container.appendChild(personElement);
  }
  const node = document.getElementById('addr')
  node.appendChild(container);
}

function renderAddresses(addresses, parentElement, prefix = '') {
    for (const [key, value] of Object.entries(addresses)) {
        const listItem = document.createElement('li');

    if (typeof value === 'string') {
      listItem.textContent = `${prefix}${key}: ${value}`;
    } else if (typeof value === 'object') {
      listItem.textContent = `${prefix}${key}:`;
      const nestedList = document.createElement('ul');
      renderAddresses(value, nestedList, '  ');
      listItem.appendChild(nestedList);
    }

    parentElement.appendChild(listItem);
  }
}


// Seed phrase
// Remove this to generate a new phrase on page refresh
const PHRASE = "differ current leg erode fog hundred file multiply word inner grain drop"

async function initWallet() {

  renderAddressBook(book)
  const w = await window.wallet({
    network : 'regtest',
    seed : {
      mnemonic : PHRASE
    }
  });

  await w.syncHistory({ all : true});
  (document.getElementById('seed')).textContent = w.seed.mnemonic
  window.demoWallet = w


  return w
}

async function  walletAction(msg) {
  const wallet = window.demoWallet

  const asset = wallet.pay[msg.asset.toLowerCase()]
  if(!asset) return setStatus(`asset: ${msg.asset} is not supported`)
  if(!asset[msg.action]) return setStatus(`action ${msg.action} not supported by wallet`)
  
  if(msg.args){
    msg.args.fee = 10
  }

  const res = await wallet.pay[msg.asset.toLowerCase()][msg.action]({ token : msg.token?.toLowerCase() }, msg.args)

  try {
    setStatus(JSON.stringify(res, null,1))
  } catch(err) {
    console.log(err)
    setStatus(`command failed`)
  }
}


function setStatus(txt) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = txt;
}

async function initMic() {
  let mediaRecorder;
  let audioChunks = [];
  let isRecording = false;

  const recordButton = document.getElementById('record');
  const audioPlayback = document.getElementById('audio');

  recordButton.onclick = toggleRecording;

  async function toggleRecording() {
    if (!isRecording) {
      await startRecording();
    } else {
      stopRecording();
    }
  }

  async function startRecording() {
    audioChunks = [];
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/ogg; codecs=opus' })

    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/ogg; codecs=opus' });
      const audioUrl = URL.createObjectURL(audioBlob);
      audioPlayback.src = audioUrl;

      await uploadAudio(audioBlob);
    };

    mediaRecorder.start();
    isRecording = true;
    recordButton.classList.add('recording')
    setStatus('Recording.... (Press again to stop recording)')
  }

  function stopRecording() {
    mediaRecorder.stop();
    isRecording = false;
    recordButton.classList.remove('recording');
  }

  async function uploadAudio(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.ogg');
    formData.append('language', 'en');

    setStatus('Uploading...')
    const response = await fetch(WHISPR, {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      setStatus(`transcribed: ${result.text}. processing ....`)
      parseTranscribe(result.text)
    } else {
      setStatus('Upload failed')
    }
  }

}

async function parseTranscribe(txt) {

  const data = {
    model: "llama3.1",
    stream: false,
    messages: [
      {
        role: "user", 
        content:`
parse the provided text into a structured JSON format.
the text is about a person interacting with a multi chain cryptocurrency wallet with natural language.
only output JSON string as output in the following format. nothing additional should be provided. 
the output will be parsed with Javascript's JSON.parse. Dont wrap JSON in any formatting. provide valid json as output. outpout is used to call a js lib like : lib[asset][action]({token}, args)
Tokens: Tether is a stablecoin that exists on various blockchains. example phrase: New tether on ethereum address: asset: ethereum, token : usdt, action: getNewAddress  
My address book of recipients is: JSON ${JSON.stringify(book,null,2)} parse the sender's address from this JSON.
{ asset: (Required. ticker of the asset, blockchain we are using. example btc, eth. must be 3 letters)
 token: (optional. ticker of the token, example usdt, Tether)
 action: (required. must be one of:  getNewAddress, sendTransaction, get history, syncHistory, getBalance),
 args : {
 amount: (if action is sending this is required),
 unit: ( the unit of the amount getting sent. must be main or base)
 address: (optional. this is recipient)
 }
}
the text is: ${txt}
`} 
    ]
  };

  let msg
  try {
    const response = await fetch(OLLAMA, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    msg = JSON.parse(result.message.content)
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
  walletAction(msg)
}


// Entry point
async function main() {
   await initWallet();
  (document.getElementById('record')).textContent  = "Record"
  initMic()

}



document.addEventListener("DOMContentLoaded", function() {
  main()
});



