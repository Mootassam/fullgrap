export default class Amount {
    static Dollar(amount) {
        if (!amount ) {
            return "0.00";
        }
        return amount.toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD'
        });
    }
}
