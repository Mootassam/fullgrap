import ApiResponseHandler from '../apiResponseHandler';
import AuthProfileEditor from '../../services/auth/authProfileEditor';
import Error403 from '../../errors/Error403';

export default async (req, res, next) => {
  try {
    if (!req.currentUser || !req.currentUser.id) {
      throw new Error403(req.language);
    }

    let editor = new AuthProfileEditor(req);
    await editor.executeMobile(req.body.data);
    const payload = true;

    await ApiResponseHandler.success(req, res, payload);
  } catch (error) {
    await ApiResponseHandler.error(req, res, error);
  }
};
