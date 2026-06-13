const localHistoryKey = 'namlo-rides-history';
const endpoint = process.env.REACT_APP_HISTORY_API_URL;

function readLocalHistory() {
  const rawHistory = localStorage.getItem(localHistoryKey);
  return rawHistory ? JSON.parse(rawHistory) : [];
}

function writeLocalHistory(history) {
  localStorage.setItem(localHistoryKey, JSON.stringify(history));
}

export const historyMode = endpoint ? 'rest' : 'local-demo';

export async function fetchRideHistory() {
  if (!endpoint) {
    return readLocalHistory();
  }

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error('Unable to fetch ride history');
  }

  return response.json();
}

export async function persistRideHistory(ride) {
  const record = {
    ...ride,
    savedAt: new Date().toISOString(),
  };

  if (!endpoint) {
    const nextHistory = [record, ...readLocalHistory()];
    writeLocalHistory(nextHistory);
    return record;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(record),
  });

  if (!response.ok) {
    throw new Error('Unable to save ride history');
  }

  return response.json();
}
