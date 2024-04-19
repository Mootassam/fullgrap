export default class Amount {
    static Dollar(amount) {
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }
}
