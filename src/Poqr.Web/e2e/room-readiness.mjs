export async function waitForRoomStateUpdate(waitForSignalRMessage, page) {
  await waitForSignalRMessage(page, 'RoomStateUpdated');
}

export async function waitForNextRoomStateUpdate(waitForNextSignalRMessage, page) {
  await waitForNextSignalRMessage(page, 'RoomStateUpdated');
}
