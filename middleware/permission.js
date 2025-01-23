const AdminUser = require('../model/admin-user');

const logger = require('../util/logger');
const { ErrorCodes } = require('../model/base-response');

const MODULES = {
  UserManagement: 'UserManagement',
  GameManagement: 'GameManagement',
  TournamentManagement: 'TournamentManagement',
  PromoCodeManagement: 'PromoCodeManagement',
  DepositTransactionManagement: 'DepositTransactionManagement',
  BonusManagement: 'BonusManagement',
  KycManagement: 'KycManagement',
  RoleAndPermissionManagement: 'RoleAndPermissionManagement',
  WithdrawalManagement: 'WithdrawalManagement',
  EarningManagement: 'EarningManagement',
  SpinWheelManagement: 'SpinWheelManagement',
  BannerManagement: 'BannerManagement',
  CMS: 'CMS',
  Reports: 'Reports',
  ContactUs: 'ContactUs',
  NotificationManagement: 'NotificationManagement',
  GSTManagement: 'GSTManagement',
  PlatformWalletManagement: 'PlatformWalletManagement',
};

function handleUnauthorized(req, res, module) {
  if (req.log) {
    req.log(`error handler: unauthorized access of ${module} APIs`);
  } else {
    logger.error(`error handler: unauthorized access of ${module} APIs`);
  }
  if (res.headersSent) {
    return;
  }
  const err = ErrorCodes.MISSING_PERMISSION;
  res.status(err.status || 500);
  if (err.errorDescription) {
    err.errorDescription = err.errorDescription.trim();
  }
  res.send({
    errors: [{ code: err.code, message: err.message }],
    errorDescription: err.errorDescription,
    module,
    meta: err.meta,
  });
}

function hasAccess(module) {
  return async (req, res, next) => {
    if (req.header('x-api-key') === process.env.INTER_COMMUNICATION_API_KEY) {
      next();
      return;
    }
    // database call to check module permission, and check if user is admin
    let hasPermission = false;
    if ('admin' === req.header('user.type')) {
      const adminUser = await AdminUser.findById(req.header('user.id'));
      if (adminUser && (
        'SuperAdmin' === adminUser.role
        || adminUser.permissions.includes(module)
      )) {
        hasPermission = true;
        req.adminUser = adminUser;
      }
    }
    if (hasPermission) {
      next();
    } else {
      handleUnauthorized(req, res, module);
    }
  };
}

function isUser(req, res, next) {
  if ('user' === req.header('user.type')) {
    next();
  } else {
    handleUnauthorized(req, res, 'User');
  }
}

function isAuthenticated(...modules) {
  if (!Array.isArray(modules)) {
    modules = [modules];
  }
  return async (req, res, next) => {
    if (req.header('x-api-key') === process.env.INTER_COMMUNICATION_API_KEY) {
      next();
      return;
    }
    // database call to check module permission, and check if user is admin
    let hasPermission = false;
    if ('admin' === req.header('user.type')) {
      const adminUser = await AdminUser.findById(req.header('user.id'));
      if (adminUser && (
        'SuperAdmin' === adminUser.role
        || adminUser.permissions.some(e => modules.includes(e))
      )) {
        hasPermission = true;
        req.adminUser = adminUser;
      }
    } else if ('user' === req.header('user.type')) {
      hasPermission = true;
    }
    if (hasPermission) {
      next();
    } else {
      handleUnauthorized(req, res, modules);
    }
  };
}

function isSystemCall(req, res, next) {
  if (req.header('x-api-key') === process.env.INTER_COMMUNICATION_API_KEY) {
    next();
  } else {
    handleUnauthorized(req, res, 'InternalSystemCall');
  }
}

module.exports = {
  MODULES,
  isUser,
  isSystemCall,
  hasAccess,
  isAuthenticated,
  hasAccess_UserManagement: hasAccess(MODULES.UserManagement),
  hasAccess_GameManagement: hasAccess(MODULES.GameManagement),
  hasAccess_TournamentManagement: hasAccess(MODULES.TournamentManagement),
  hasAccess_PromoCodeManagement: hasAccess(MODULES.PromoCodeManagement),
  hasAccess_DepositTransactionManagement: hasAccess(MODULES.DepositTransactionManagement),
  hasAccess_BonusManagement: hasAccess(MODULES.BonusManagement),
  hasAccess_KycManagement: hasAccess(MODULES.KycManagement),
  hasAccess_RoleAndPermissionManagement: hasAccess(MODULES.RoleAndPermissionManagement),
  hasAccess_WithdrawalManagement: hasAccess(MODULES.WithdrawalManagement),
  hasAccess_EarningManagement: hasAccess(MODULES.EarningManagement),
  hasAccess_SpinWheelManagement: hasAccess(MODULES.SpinWheelManagement),
  hasAccess_BannerManagement: hasAccess(MODULES.BannerManagement),
  hasAccess_CMS: hasAccess(MODULES.CMS),
  hasAccess_Reports: hasAccess(MODULES.Reports),
  hasAccess_ContactUs: hasAccess(MODULES.ContactUs),
  hasAccess_NotificationManagement: hasAccess(MODULES.NotificationManagement),
  hasAccess_GSTManagement: hasAccess(MODULES.GSTManagement),
  hasAccess_PlatformWalletManagement: hasAccess(MODULES.PlatformWalletManagement)
};
