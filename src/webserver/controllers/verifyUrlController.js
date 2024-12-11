const { db, utils } = require("attestation-kit");

const { logger, Validation, generateParingUrlWithVerifyData, ErrorWithMessage } = utils;

module.exports = async (request, reply) => {
    const { service_provider, address } = request.params;
    const data = request.query;

    try {
        if (!Validation.isServiceProvider(service_provider) || !Validation.isWalletAddress(address) || !Validation.isDataObject(data)) {
            throw new ErrorWithMessage('Invalid service provider', { code: "INVALID_DATA" });
        }

        const order = await db.getAttestationOrders({ serviceProvider: service_provider, data, address });

        if (order) {
            if (order.status === 'attested') {
                throw new ErrorWithMessage('Order already attested', { code: "ORDER_ALREADY_ATTESTED" });
            } else {
                const pairingUrlWithVerifyData = generateParingUrlWithVerifyData(service_provider, address, data);
                reply.redirect(pairingUrlWithVerifyData);
            }
        } else {
            throw new ErrorWithMessage('Order not found', { code: "ORDER_NOT_FOUND" });
        }
    } catch (err) {
        logger.error('(generateParingUrlWithVerifyData): UNKNOWN ERROR', err);
        reply.badRequest(err.code ?? 'UNKNOWN_ERROR');
    }
}