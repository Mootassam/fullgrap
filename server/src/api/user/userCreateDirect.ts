import UserRepository from '../../database/repositories/userRepository';
import TenantUserRepository from '../../database/repositories/tenantUserRepository';
import PermissionChecker from '../../services/user/permissionChecker';
import ApiResponseHandler from '../apiResponseHandler';
import Permissions from '../../security/permissions';
import bcrypt from 'bcrypt';

export default async (req, res) => {
  try {
    new PermissionChecker(req).validateHas(
      Permissions.values.userCreate,
    );

    const {
      email,
      password,
      phoneNumber,
      fullName,
      firstName,
      lastName,
      gender,
      balance,
      invitationcode,
      status,
    } = req.body;

    // The vip field comes from an autocomplete and may be an object { id, label }
    // or a plain ID string — normalise to a raw ID.
    const rawVip = req.body.vip;
    const vipId: string | null = rawVip?.id || rawVip || null;

    const hashedPassword = await bcrypt.hash(password, 12);

    const data = {
      email,
      password: hashedPassword,
      phoneNumber,
      fullName,
      firstName,
      lastName,
      gender,
      balance: balance !== undefined ? Number(balance) : undefined,
      invitationcode,
      // Pass the normalised VIP ID so createFromAuthMobile can use it.
      vip: vipId,
      req,
    };

    const user = await UserRepository.createFromAuthMobile(data, req);

    // Add the new user to the current tenant with role=member and the
    // requested status (defaults to 'active').
    await TenantUserRepository.updateRoles(
      req.currentTenant.id,
      user.id,
      ['member'],
      req,
      status || 'active',
    );

    await ApiResponseHandler.success(req, res, user);
  } catch (error) {
    await ApiResponseHandler.error(req, res, error);
  }
};
