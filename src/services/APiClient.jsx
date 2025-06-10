class APIClient {
  constructor(baseURL) {
    this.baseURL = baseURL;
  }

  async request(url, options) {
    const response = await fetch(`${this.baseURL}${url}`, options);
    if (!response.ok) {
      const error = new Error('HTTP Error');
      error.status = response.status;
      error.response = await response.json();
      throw error;
    }
    return response.json();
  }

  get(url) {
    return this.request(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Customauthorization': 'Bearer ' + localStorage.getItem('token')
      },
    });
  }

  post(url, data) {
    return this.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Customauthorization': 'Bearer ' + localStorage.getItem('token')
      },
      body: JSON.stringify(data),
    });
  }

  // You can add more methods (put, delete, etc.) here as needed
}

export const apiClient = new APIClient('https://gestione.parrocchiacarpaneto.com/servizi/api');