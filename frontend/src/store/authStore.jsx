    // // authStore.js
    // class AuthStore {
    //   constructor() {
    //     this.user = null;          // hold current user
    //     this.listeners = [];       // list of functions to call on change
    //   }

    //   subscribe(listener) {
    //     this.listeners.push(listener);
    //     // Immediately send current user when subscribed
    //     listener(this.user);
    //     // Return unsubscribe function
    //     return () => {
    //       this.listeners = this.listeners.filter(l => l !== listener);
    //     };
    //   }

    //   setUser(user) {
    //     this.user = user;
    //     this.listeners.forEach(listener => listener(user));
    //   }

    //   getUser() {
    //     return this.user;
    //   }

    //   logout() {
    //     this.setUser(null);
    //   }
    // }

    // export const authStore = new AuthStore();
