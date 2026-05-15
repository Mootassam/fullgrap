import ApiResponseHandler from '../apiResponseHandler';

export default async (req, res) => {
  try {
    const userId = req.params.id;
    const database = req.database;
    const currentTenant = req.currentTenant;
    const currentUser = req.currentUser;

    const User = database.model('user');
    const Transaction = database.model('transaction');

    const targetUser = await User.findById(userId).lean();

    if (!targetUser) {
      return res.status(404).json({ errors: [{ message: 'User not found' }] });
    }

    const balance = Number(targetUser.balance) || 0;

    if (balance >= 0) {
      return res.status(400).json({ errors: [{ message: 'Balance is not negative' }] });
    }

    const amount = Math.abs(balance);

    // Step 1: Reset balance to 0
    await User.findByIdAndUpdate(
      userId,
      { $set: { balance: 0, updatedBy: currentUser.id } }
    );

    // Step 2: Create deposit transaction with status 'success'
    await Transaction.create({
      type: 'deposit',
      status: 'success',
      amount: amount.toString(),
      user: userId,
      tenant: currentTenant.id,
      datetransaction: new Date(),
      createdBy: currentUser.id,
      updatedBy: currentUser.id,
    });

    // Step 3: Update balance from 0 to the deposited amount
    await User.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount }, $set: { updatedBy: currentUser.id } }
    );

    await ApiResponseHandler.success(req, res, { amount });
  } catch (error) {
    await ApiResponseHandler.error(req, res, error);
  }
};
