const { DataTypes } = require('sequelize');

module.exports = function(sequelize) {
    const SponsorLog = sequelize.define('SponsorLog', {
        sponsor_at: {
            type: DataTypes.DATE,
        },
        type: { // 1-gas 2-storage
            type: DataTypes.INTEGER,
        },
        value: {
            type: DataTypes.INTEGER,
        },
        nonce: {
            type: DataTypes.INTEGER,
        },
        hash: {
            type: DataTypes.STRING,
        },
        from: {
            type: DataTypes.STRING,
        },
        to: {
            type: DataTypes.STRING,
        },
        contract: {
            type: DataTypes.STRING,
        },
    }, {
        tableName: "sponsor_logs",
        timestamps: false,
    });
    return SponsorLog;     
}

/*
    CREATE TABLE `sponsor_logs` (
        `id` bigint unsigned NOT NULL AUTO_INCREMENT,
        `created_at` datetime(3) DEFAULT NULL,
        `updated_at` datetime(3) DEFAULT NULL,
        `deleted_at` datetime(3) DEFAULT NULL,
        `sponsor_at` datetime(3) DEFAULT NULL,
        `type` integer DEFAULT NULL,
        `value` bigint DEFAULT '0',
        `nonce` bigint DEFAULT '0',
        `hash` varchar(255) DEFAULT NULL,
        `from` varchar(255) DEFAULT NULL,
        `to` varchar(255) DEFAULT NULL,
        `contract` varchar(255) DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `nonce` (`nonce`)
    ) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
*/