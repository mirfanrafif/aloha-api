-- MySQL dump 10.13  Distrib 5.5.62, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: aloha_api
-- ------------------------------------------------------
-- Server version	5.5.5-10.3.34-MariaDB-0ubuntu0.20.04.1
--
-- Table structure for table `conversations`
--
--
-- Table structure for table `customer`
--
DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `customer` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `customer_crm_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_2e64383bae8871598afb8b73f0` (`phoneNumber`),
  UNIQUE KEY `customer_customer_crm_id_uindex` (`customer_crm_id`)
) ENGINE = InnoDB AUTO_INCREMENT = 487 DEFAULT CHARSET = utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `users`
--
DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `full_name` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `profile_photo` varchar(255) DEFAULT NULL,
  `created_at` timestamp(6) NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`)
) ENGINE = InnoDB AUTO_INCREMENT = 14 DEFAULT CHARSET = utf8mb4;
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
    'Irfan',
    'admin',
    'admin@rajadinar.com',
    '$2b$10$wT1Of0Q2bD7TcB3ld6uDxOoeT4GNI/iVl/nACsFuqzdTsJXOefiQy',
    'admin',
    'image_picker2811-1650574177544.jpg',
    '2022-03-15 17:55:40.802450',
    '2022-04-24 16:04:55.205796',
    null
  ),
  (
    3,
    'Irfan',
    'm1y4ru5',
    'm1y4ru5@gmail.com',
    '$2b$10$wT1Of0Q2bD7TcB3ld6uDxOoeT4GNI/iVl/nACsFuqzdTsJXOefiQy',
    'agent',
    'image_picker9069-1650441175687.png',
    '2022-03-16 09:15:20.300907',
    '2022-04-20 07:52:55.000000',
    null
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
    '2022-03-24 18:42:04.611196',
    null
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
    '2022-03-24 18:42:28.287569',
    null
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
    '2022-04-16 05:59:55.000000',
    null
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
    '2022-04-16 05:59:54.000000',
    null
  ),
  (
    8,
    'Taufik',
    'taufik',
    'sales3@rajadinar.com',
    '$2b$10$KIjcp1OBkfMf6ClHWvEocuIu4PRfN7Uxi.oDP197aNCwjIDigN3CC',
    'agent',
    NULL,
    '2022-04-19 01:42:59.695678',
    '2022-04-23 02:42:54.000000',
    null
  ),
  (
    9,
    'rama',
    'rama',
    'rama@gmail.com',
    '$2b$10$t0DxLAqhjVZNIyZE6xFl8OYMpk5GDN6/s.dMtID3QtWOtS4oxP8iC',
    'agent',
    NULL,
    '2022-04-21 15:50:46.984036',
    '2022-04-21 15:51:35.000000',
    null
  ),
  (
    10,
    'don',
    'don',
    'don@app.com',
    '$2b$10$1af1q5VOKzv8Kbb7gKjq4uTIbHliHQqMGqzNHU5VZ3n6vodVKi25m',
    'agent',
    NULL,
    '2022-04-21 15:55:45.615099',
    '2022-04-21 15:55:45.615099',
    null
  ),
  (
    11,
    'Irfan',
    'irfan',
    'mirfanrafif17@outlook.com',
    '$2b$10$2u2QKTWIqT9nkH1X0YBRzuxBjlIt2ExX3Zfp/j8cPvuqLPhdY7wGK',
    'agent',
    NULL,
    '2022-04-21 17:45:05.477667',
    '2022-04-21 20:49:05.000000',
    null
  ),
  (
    13,
    'Adit',
    'adit',
    'adit@app.com',
    '$2b$10$Z1msn5pA3vJgVmQY4Myb4OFrahHuAhwyTr4St9dHkrU5NyzJTe5vG',
    'admin',
    NULL,
    '2022-04-25 14:47:19.254101',
    '2022-04-25 14:47:19.254101',
    null
  );
/*!40000 ALTER TABLE `users` ENABLE KEYS */
;
UNLOCK TABLES;
DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `customerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_5a4866f304edf4591ad785d34a` (`customerId`),
  CONSTRAINT `FK_5a4866f304edf4591ad785d34a4` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 39 DEFAULT CHARSET = utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `job`
--
DROP TABLE IF EXISTS `job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `job` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  PRIMARY KEY (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 12 DEFAULT CHARSET = utf8mb4;
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
    8,
    'Pesanan diatas 1 ton',
    'Sales yang menangani pesanan diatas 1 ton',
    '2022-04-20 04:50:58.455743',
    '2022-04-20 04:50:58.455743'
  ),
  (
    10,
    'Pesanan sampingan / by product',
    'Sales yang menangani pesanan sampingan/by product',
    '2022-04-20 04:53:18.590576',
    '2022-04-20 04:53:18.590576'
  ),
  (
    11,
    'Lowongan kerja',
    'Sales yang mengangani lowongan kerja',
    '2022-04-20 09:59:06.568508',
    '2022-04-20 09:59:06.568508'
  );
/*!40000 ALTER TABLE `job` ENABLE KEYS */
;
UNLOCK TABLES;
--
-- Table structure for table `customer_agent`
--
DROP TABLE IF EXISTS `customer_agent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `customer_agent` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_at` timestamp(6) NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `customerId` int(11) DEFAULT NULL,
  `agentId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_b930c1d9ca068384995aebd3586` (`customerId`),
  KEY `FK_59468740ee03043fd9e473af29b` (`agentId`),
  CONSTRAINT `FK_59468740ee03043fd9e473af29b` FOREIGN KEY (`agentId`) REFERENCES `users` (`id`),
  CONSTRAINT `FK_b930c1d9ca068384995aebd3586` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 48 DEFAULT CHARSET = utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `message`
--
DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `message` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `messageId` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `status` varchar(255) NOT NULL,
  `file` varchar(255) DEFAULT NULL,
  `type` varchar(255) NOT NULL,
  `fromMe` tinyint(4) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `agentId` int(11) DEFAULT NULL,
  `customerId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK_640c87a856a4ab1937c8628cf71` (`agentId`),
  KEY `FK_38eae633b624437d687be9c5471` (`customerId`),
  CONSTRAINT `FK_38eae633b624437d687be9c5471` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`),
  CONSTRAINT `FK_640c87a856a4ab1937c8628cf71` FOREIGN KEY (`agentId`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 3862 DEFAULT CHARSET = utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Table structure for table `message_template`
--
DROP TABLE IF EXISTS `message_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `message_template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT current_timestamp(6) ON UPDATE current_timestamp(6),
  `agent_id` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `message_template_users_id_fk` (`agent_id`),
  CONSTRAINT `message_template_users_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 18 DEFAULT CHARSET = utf8mb4;
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
    4,
    'Terimakasih',
    'Terimakasih telah menghubungi kami. hehehe',
    '2022-04-21 03:57:07.984430',
    '2022-04-25 14:35:12.000000',
    1
  ),
  (
    9,
    'Selamat pagi',
    'Selamat pagi, pelanggan setia rajadinar. Hari ini kita produksi ya.',
    '2022-04-21 17:16:31.765502',
    '2022-04-21 17:16:31.765502',
    1
  ),
  (
    10,
    'Selamat pagi',
    'Selamat pagi pelanggan setia rajadinar. Semoga diberikan keberkahan',
    '2022-04-21 17:19:37.420879',
    '2022-04-21 17:19:37.420879',
    3
  ),
  (
    16,
    'Halo',
    'Selamat malam, kamu',
    '2022-04-25 14:38:29.980306',
    '2022-04-25 14:38:29.980306',
    1
  ),
  (
    17,
    'Maaf',
    'Maaf, untuk saat ini stok untuk produk tersebut lagi kosong.',
    '2022-04-25 14:39:22.365472',
    '2022-04-25 14:40:10.000000',
    1
  );
/*!40000 ALTER TABLE `message_template` ENABLE KEYS */
;
UNLOCK TABLES;
--
-- Table structure for table `user_job`
--
DROP TABLE IF EXISTS `user_job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */
;
/*!40101 SET character_set_client = utf8 */
;
CREATE TABLE `user_job` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `job_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `priority` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_job_job_id_fk` (`job_id`),
  KEY `user_job_users_id_fk` (`user_id`),
  CONSTRAINT `user_job_job_id_fk` FOREIGN KEY (`job_id`) REFERENCES `job` (`id`),
  CONSTRAINT `user_job_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE = InnoDB AUTO_INCREMENT = 24 DEFAULT CHARSET = utf8mb4;
/*!40101 SET character_set_client = @saved_cs_client */
;
--
-- Dumping data for table `user_job`
--
LOCK TABLES `user_job` WRITE;
/*!40000 ALTER TABLE `user_job` DISABLE KEYS */
;
INSERT INTO `user_job`
VALUES (
    7,
    2,
    3,
    0,
    '2022-04-20 05:46:24',
    '2022-04-20 05:46:24'
  ),
  (
    12,
    2,
    7,
    0,
    '2022-04-20 05:47:14',
    '2022-04-20 05:47:14'
  ),
  (
    13,
    10,
    7,
    0,
    '2022-04-20 05:47:15',
    '2022-04-20 05:47:15'
  ),
  (
    15,
    8,
    6,
    0,
    '2022-04-20 06:42:01',
    '2022-04-20 06:42:01'
  ),
  (
    17,
    2,
    8,
    0,
    '2022-04-21 18:31:49',
    '2022-04-21 18:31:49'
  ),
  (
    20,
    2,
    11,
    0,
    '2022-04-22 00:45:29',
    '2022-04-22 00:45:29'
  ),
  (
    21,
    2,
    13,
    0,
    '2022-04-25 21:47:29',
    '2022-04-25 21:47:29'
  ),
  (
    23,
    10,
    13,
    0,
    '2022-04-25 21:47:33',
    '2022-04-25 21:47:33'
  );
/*!40000 ALTER TABLE `user_job` ENABLE KEYS */
;
UNLOCK TABLES;
--
-- Dumping routines for database 'aloha_api'
--