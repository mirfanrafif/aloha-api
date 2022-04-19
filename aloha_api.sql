--
-- Table structure for table `customer`
--
DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `customer` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `customer_crm_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_2e64383bae8871598afb8b73f0` (`phoneNumber`),
  UNIQUE KEY `customer_customer_crm_id_uindex` (`customer_crm_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 327 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `conversations`
--
DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `customerId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_5a4866f304edf4591ad785d34a` (`customerId`),
  CONSTRAINT `FK_5a4866f304edf4591ad785d34a4` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 26 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `users`
--
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Dumping data for table `users`
--
LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */
;
INSERT INTO `users`
VALUES (
    1,
    'Mo',
    'mirfanrafif17',
    'mirfanrafif17@gmail.com',
    '$2b$10$7WQcNImnhA8xSKrjHuR43OKto00kyToduaa5ucLV6YLtHUwsgh1IK',
    'admin',
    NULL,
    '2022-03-15 17:55:40.802450',
    '2022-04-08 00:18:50.000000'
  ),
  (
    3,
    'Irfan',
    'm1y4ru5',
    'm1y4ru5@gmail.com',
    '$2b$10$wT1Of0Q2bD7TcB3ld6uDxOoeT4GNI/iVl/nACsFuqzdTsJXOefiQy',
    'agent',
    NULL,
    '2022-03-16 09:15:20.300907',
    '2022-04-19 02:01:09.000000'
  ),
  (
    4,
    'ALOHA',
    'aloha',
    'aloha@rajadinar.com',
    '$2b$10$.ZLtGXvxyNmJsLjPEIrasOq5upNXKw48wC4VAVpEuU7ds.1jAY8Ku',
    'sistem',
    NULL,
    '2022-03-24 18:42:04.611196',
    '2022-03-24 18:42:04.611196'
  ),
  (
    5,
    'PukaPuka',
    'crm',
    'crm@rajadinar.com',
    '$2b$10$R3hXdt9EQXmip.lv4NEAbewTtgkfKlkFFvN/mt/sYM0k8Sy/D/xfW',
    'sistem',
    NULL,
    '2022-03-24 18:42:28.287569',
    '2022-03-24 18:42:28.287569'
  ),
  (
    6,
    'Mbah Ban',
    'Mbahban',
    'mbah@ban.com',
    '$2b$10$HMhjAyR7Nn.hDl1lo5HJreE8fVeoN1MVrUiKFFoohqq7ZylyPYvoS',
    'agent',
    NULL,
    '2022-04-06 21:59:20.786151',
    '2022-04-16 05:59:55.000000'
  ),
  (
    7,
    'Irfan',
    'm4k4nb4n6',
    'm4k4nb4n6@gmail.com',
    '$2b$10$l.uSVrDBbfKSpZ9RDOGOC.u6r7AVLaY.U/COLtbgp0IQlCIU7V2x2',
    'agent',
    NULL,
    '2022-04-07 09:09:42.240160',
    '2022-04-16 05:59:54.000000'
  ),
  (
    8,
    'Taufik',
    'taufik',
    'sales3@rajadinar.com',
    '$2b$10$FK4mRKRUKQmByxw8dxsEF.SiGSVC26oNcAXoQFrQ6XW91K8vAEW1K',
    'agent',
    NULL,
    '2022-04-19 01:42:59.695678',
    '2022-04-19 01:42:59.695678'
  );
/*!40000 ALTER TABLE `users` ENABLE KEYS */
;
UNLOCK TABLES;
--
-- Table structure for table `job`
--
DROP TABLE IF EXISTS `job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `job` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 8 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Dumping data for table `job`
--
LOCK TABLES `job` WRITE;
/*!40000 ALTER TABLE `job` DISABLE KEYS */
;
INSERT INTO `job`
VALUES (
    2,
    'Pesanan dibawah 1 ton',
    'Sales yang melayani pesanan dibawah 1 ton',
    '2022-03-15 19:41:39.414154',
    '2022-03-24 18:38:35.171380'
  ),
  (
    3,
    'Pesanan sampingan / by product',
    'Sales yang melayani pesanan sampingan',
    '2022-03-15 19:41:39.428621',
    '2022-03-24 18:38:35.171380'
  ),
  (
    4,
    'Reseller',
    'Sales yang melayani reseller',
    '2022-03-15 19:41:39.443011',
    '2022-03-24 18:38:35.171380'
  ),
  (
    7,
    'Komplain pelayanan',
    'Agen dapat melayani pesan terkait komplain pelayanan',
    '2022-04-19 01:43:48.658901',
    '2022-04-19 01:43:48.658901'
  );
/*!40000 ALTER TABLE `job` ENABLE KEYS */
;
UNLOCK TABLES;
--
-- Table structure for table `user_job`
--
DROP TABLE IF EXISTS `user_job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `user_job` (
  `id` int NOT NULL AUTO_INCREMENT,
  `job_id` int NOT NULL,
  `user_id` int NOT NULL,
  `priority` int NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_job_job_id_fk` (`job_id`),
  KEY `user_job_users_id_fk` (`user_id`),
  CONSTRAINT `user_job_job_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job` (`id`),
  CONSTRAINT `user_job_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 9 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Dumping data for table `user_job`
--
LOCK TABLES `user_job` WRITE;
/*!40000 ALTER TABLE `user_job` DISABLE KEYS */
;
/*!40000 ALTER TABLE `user_job` ENABLE KEYS */
;
UNLOCK TABLES;
--
-- Table structure for table `customer_agent`
--
DROP TABLE IF EXISTS `customer_agent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `customer_agent` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `customerId` int DEFAULT NULL,
  `agentId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_b930c1d9ca068384995aebd3586` (`customerId`),
  KEY `FK_59468740ee03043fd9e473af29b` (`agentId`),
  CONSTRAINT `FK_59468740ee03043fd9e473af29b` FOREIGN KEY (`agentId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_b930c1d9ca068384995aebd3586` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 26 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `message`
--
DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `message` (
  `id` int NOT NULL AUTO_INCREMENT,
  `messageId` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(255) NOT NULL,
  `file` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `fromMe` tinyint NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `agentId` int DEFAULT NULL,
  `customerId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_640c87a856a4ab1937c8628cf71` (`agentId`),
  KEY `FK_38eae633b624437d687be9c5471` (`customerId`),
  CONSTRAINT `FK_38eae633b624437d687be9c5471` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `FK_640c87a856a4ab1937c8628cf71` FOREIGN KEY (`agentId`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 2857 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `message_template`
--
DROP TABLE IF EXISTS `message_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!50503 SET character_set_client = utf8mb4 */
;
CREATE TABLE `message_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3 DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Dumping data for table `message_template`
--
LOCK TABLES `message_template` WRITE;
/*!40000 ALTER TABLE `message_template` DISABLE KEYS */
;
INSERT INTO `message_template`
VALUES (
    1,
    'terimakasih',
    'Terimakasih telah apa ya',
    '2022-04-03 13:51:20.664492',
    '2022-04-03 13:51:20.664492'
  ),
  (
    2,
    'terimakasih juga',
    'Terimakasih telah itu',
    '2022-04-03 13:51:31.593613',
    '2022-04-03 13:51:31.593613'
  );
/*!40000 ALTER TABLE `message_template` ENABLE KEYS */
;
UNLOCK TABLES;