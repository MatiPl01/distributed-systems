export const protoTimestampToJsDate = timestamp => {
  return new Date(timestamp.seconds * 1000 + timestamp.nanos / 1000000);
};
