import { put, takeLatest, select, all, takeEvery, delay } from 'redux-saga/effects';
import { showLoading, hideLoading } from 'react-redux-loading-bar'
import {
    USER_LOGOUT, USER_LOGIN, DOCTOR_LOGIN, DOCTOR_LOGOUT,
    GUEST_SEND_PHONE, GUEST_SEND_OTP, GUEST_REGISTER,
    FORGOT_PASSWORD_SEND_PHONE, FORGOT_PASSWORD_CANCEL_REQUEST, FORGOT_PASSWORD_RESET_PASSWORD, FORGOT_PASSWORD_SEND_OTP
} from './action';
// import authService from "../../services/authService";
// import userService from "../../services/userService"
import {
    userLogout, userLoginSuccessful,
    guestSendPhoneSuccessful, guestRegisterSuccessful, guestSendOTPSuccessful,
    forgotPasswordSendPhoneSuccessful, forgotPasswordCancelDone, resetPasswordDone, forgotPasswordSendOTPSuccessful, saveTimeOutOTP
} from '.';
import authService from '../../service/authService'
import { openLoading, closeLoading } from '../ui';
import { message } from 'antd';
import { clearUserInfo, saveIoInstance } from '../user';
import _ from 'lodash'
import { resetPackageForm } from '../booking';
import { clearIoInstance } from '../notification';

function* watchUserLoginWorker(action) {
    try {
        yield put(openLoading())
        message.loading('Xin vui lòng chờ');
        const result = yield authService.userLogin(action.user);

        if (result && result.token) {

            yield put(userLoginSuccessful(result.token));
            message.destroy();
            message.success('Đăng nhập thành công');
        }

    } catch (error) {
        message.destroy();
        message.error(error?.response?.data?.err)
    } finally {
        // message.destroy()
        yield put(closeLoading())
    }
}

function* watchUserLogout(action) {
    try {
        yield put(showLoading())
        const { io } = yield select(state => state.notify)
        if(io){
            io.emit("logout", "");
        }
        yield put(clearUserInfo())
        yield put(clearIoInstance())
        yield put(resetPackageForm())
    } catch (error) {
        console.log(error);
    } finally {
        yield put(hideLoading())
    }
}

function* watchForgotPasswordSendPhone(action) {
    try {
        yield put(openLoading())
        message.loading('Đang gửi yêu cầu');
        const result = yield authService.handleForgotPasswordSendPhone(action.phone);
        if (result) {
            yield put(forgotPasswordSendPhoneSuccessful(result));
            yield put(saveTimeOutOTP(Date.now()+300000));
            message.destroy();
            message.success('Mã OTP đang được gửi đến', 3);
        }
    } catch (error) {
        message.destroy();
        if (error.response?.data?.status === "10") {
            message.error("SĐT này cần chờ 5 phút để gửi lại yêu cầu!", 4);
        } else {
            message.error(error.response?.data?.err ?? "Hệ thống quá tải!", 4);
        }
    } finally {
        yield put(closeLoading())
    }
}

function* watchForgotPasswordSendOTP(action) {
    try {
        yield put(openLoading())
        message.loading('Đang gửi yêu cầu');
        const result = yield authService.handleForgotPasswordSendOTP(action);
        if (result) {
            yield put(forgotPasswordSendOTPSuccessful());
            message.destroy();
            message.success('Xác thực thành công!', 4);
        }
    } catch (error) {
        message.destroy();
        if (error.response?.data?.status === "16") {
            message.error("Mã OTP không chính xác!", 4);
        }else{
            message.error(error.response?.data?.err ?? "Hệ thống quá tải!", 4);
        }
    } finally {
        yield put(closeLoading())
    }
}

function* watchResetPassword(action) {
    try {
        yield put(openLoading())
        message.loading('Đang gửi yêu cầu');
        const result = yield authService.handleResetPassword(action);
        if (result) {
            yield put(resetPasswordDone());
            yield put(saveTimeOutOTP(0));
            message.destroy();
            message.success('Mật khẩu mới đã được áp dụng!', 3);
        }
    } catch (error) {
        message.destroy();
        if (error.response?.data?.err?.status === "101") {
            message.destroy();
            message.error("Đường truyền bị gián đoạn, xin hãy thử lại!", 5);
        } else {
            message.destroy();
            message.error(error.response?.data?.err ?? "Hệ thống quá tải!", 3);
        }
    } finally {
        yield put(closeLoading())
    }
}

function* watchForgotPasswordCancelRequest(action) {
    try {
        yield put(openLoading())

        /*  100% Cancel Request Successfully after force user wait 30s minimum.

            Checked case: before 5 minutes (since lastest time user sent Change pass request (step 1)) → cancel req → re-request step 1
            SO, no need to worry if our backend request cancel that "request_id" (otpID) to Nexmo server failed (error status 3).
        */
        message.destroy();
        yield put(forgotPasswordCancelDone());
        yield put(saveTimeOutOTP(0));
        message.info('Đã huỷ yêu cầu!', 3);

        if(action.requestID){
            yield authService.handleForgotPasswordCancelRequest(action.requestID);
        }
    } catch (error) {
        if(error.response?.data?.err){
            message.destroy();
            message.error(error.response?.data?.err, 4);
        }
    } finally {
        yield put(closeLoading())
    }
}

function* watchGuestSendPhone(action) {
    try {
        yield put(openLoading())
        message.loading('Đang gửi yêu cầu');
        const result = yield authService.handleGuestSendPhone(action);
        if (result && result.request_id) {
            yield put(guestSendPhoneSuccessful(result.request_id, result.phone, result.fullName, result.dob, result.gender));
            yield put(saveTimeOutOTP(Date.now() + 300000));
            message.destroy();
            message.success('Mã OTP đang được gửi đến', 3);
        }
    } catch (error) {
        message.destroy();
        message.error('Số điện thoại không hợp lệ', 2);
    } finally {
        yield put(closeLoading())
    }
}

function* watchGuestSendOTP(action) {
    try {
        yield put(openLoading())
        message.loading('Đang xác thực OTP');
        const result = yield authService.handleGuestSendOTP(action.dataOTP);
        if (result) {
            yield put(guestSendOTPSuccessful());
            message.destroy();
            message.success('Xác thực thành công!', 3);
        }
    } catch (error) {
        message.destroy();
        message.error('Mã OTP không đúng', 2);
    } finally {
        yield put(closeLoading())
    }
}

function* watchGuestRegister(action) {
    try {
        yield put(openLoading());
        message.destroy();
        message.loading('Đang tạo tài khoản');
        const result = yield authService.handleGuestRegister(action.info);
        if (!_.isEmpty(result)) {
            message.destroy();
            message.success('Tạo tài khoản thành công!');
            yield put(guestRegisterSuccessful());
            yield put(saveTimeOutOTP(0));
        }
    } catch (error) {
        message.destroy();
        console.log(error.response?.data?.err)
        if (error.response?.data?.err?.status == 101) {
            message.error("Đường truyền bị gián đoạn, xin hãy thử lại sau vài giây!", 5);
        } else {
            message.error(error.response?.data?.err ?? "Hệ thống quá tải!", 3);
        }
    } finally {
        yield put(closeLoading())
    }
}

export function* authSaga() {
    yield takeLatest(USER_LOGIN, watchUserLoginWorker);
    yield takeLatest(USER_LOGOUT, watchUserLogout);
    yield takeLatest(FORGOT_PASSWORD_SEND_PHONE, watchForgotPasswordSendPhone);
    yield takeLatest(FORGOT_PASSWORD_SEND_OTP, watchForgotPasswordSendOTP);
    yield takeLatest(FORGOT_PASSWORD_RESET_PASSWORD, watchResetPassword);
    yield takeLatest(FORGOT_PASSWORD_CANCEL_REQUEST, watchForgotPasswordCancelRequest);
    yield takeLatest(GUEST_SEND_PHONE, watchGuestSendPhone);
    yield takeLatest(GUEST_SEND_OTP, watchGuestSendOTP);
    yield takeLatest(GUEST_REGISTER, watchGuestRegister);
}