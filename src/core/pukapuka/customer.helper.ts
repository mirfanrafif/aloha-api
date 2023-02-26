function convertPhoneNumber(telephones: string): string | undefined {
  let phoneNumber = '';

  const telephonesArray = telephones.split(',');

  if (telephonesArray.length == 0) {
    return;
  }

  if (telephonesArray[0].startsWith('0')) {
    phoneNumber = '62' + telephonesArray[0].slice(1);
  } else {
    phoneNumber = telephonesArray[0];
  }

  if (phoneNumber.length === 0) return;
  phoneNumber = phoneNumber.split('-').join('');
  phoneNumber = phoneNumber.split(' ').join('');

  return phoneNumber;
}

export { convertPhoneNumber };
