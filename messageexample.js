const text = {
  id: '3EB01514B329860DD26B',
  pushName: 'Dharma Yudistira',
  isGroup: false,
  group: { subject: '', owner: '', desc: '' },
  message: 'ngedukno jeruk teko motor',
  phone: '6282228868960',
  messageType: 'text',
  file: '',
  mimeType: '',
  deviceId: '657ID1',
  sender: '6282338819564',
  timestamp: '2022-03-10T15: 25: 12Z',
};
const document = {
  id: '3EB01211D013AFDB7699',
  pushName: 'Dharma Yudistira',
  isGroup: false,
  group: { subject: '', owner: '', desc: '' },
  message: '',
  phone: '6282228868960',
  messageType: 'document',
  file: '3EB01211D013AFDB7699.pdf',
  mimeType: 'application/pdf',
  deviceId: '657ID1',
  sender: '6282338819564',
  timestamp: '2022-03-10T15: 26: 38Z',
};
const image = {
  id: '3EB050A8812A8A25C396',
  pushName: 'Dharma Yudistira',
  isGroup: false,
  group: { subject: '', owner: '', desc: '' },
  message: '',
  phone: '6282228868960',
  messageType: 'image',
  file: '3EB050A8812A8A25C396.jpeg',
  mimeType: 'image/jpeg',
  deviceId: '657ID1',
  sender: '6282338819564',
  timestamp: '2022-03-10T15: 26: 52Z',
};

const chat = /<~ (.*)/gi.exec(text.message);

console.log(chat);
