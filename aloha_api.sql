--
-- Table structure for table `customer`
--

DROP TABLE IF EXISTS `customer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=305 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `conversations`
--


DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `status` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  `customerId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `REL_5a4866f304edf4591ad785d34a` (`customerId`),
  CONSTRAINT `FK_5a4866f304edf4591ad785d34a4` FOREIGN KEY (`customerId`) REFERENCES `customer` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=22 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;


--
-- Table structure for table `user_job`
--

DROP TABLE IF EXISTS `user_job`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_job` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` varchar(255) NOT NULL,
  `created_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_job`
--

LOCK TABLES `user_job` WRITE;
/*!40000 ALTER TABLE `user_job` DISABLE KEYS */;
INSERT INTO `user_job` VALUES (1,'Pesanan diatas 1 ton','Sales yang melayani pesanan diatas 1 ton','2022-03-16 02:41:39.394909','2022-03-25 01:38:35.171380'),(2,'Pesanan dibawah 1 ton','Sales yang melayani pesanan dibawah 1 ton','2022-03-16 02:41:39.414154','2022-03-25 01:38:35.171380'),(3,'Pesanan sampingan / by product','Sales yang melayani pesanan sampingan','2022-03-16 02:41:39.428621','2022-03-25 01:38:35.171380'),(4,'Reseller','Sales yang melayani reseller','2022-03-16 02:41:39.443011','2022-03-25 01:38:35.171380'),(5,'Lowongan kerja','Info lowongan kerja','2022-03-16 02:41:39.453692','2022-03-25 01:38:35.171380'),(6,'Komplain pelayanan','Agen dapat melayani pesan terkait komplain pelayanan','2022-03-17 04:37:23.467819','2022-03-25 01:38:35.171380');
/*!40000 ALTER TABLE `user_job` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `jobId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `IDX_fe0bb3f6520ee0469504521e71` (`username`),
  UNIQUE KEY `IDX_97672ac88f789774dd47f7c8be` (`email`),
  KEY `FK_deceed16bcc624dbf873508e5bc` (`jobId`),
  CONSTRAINT `FK_deceed16bcc624dbf873508e5bc` FOREIGN KEY (`jobId`) REFERENCES `user_job` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Mo','mirfanrafif17','mirfanrafif17@gmail.com','$2b$10$7WQcNImnhA8xSKrjHuR43OKto00kyToduaa5ucLV6YLtHUwsgh1IK','admin',NULL,'2022-03-16 00:55:40.802450','2022-04-08 07:18:50.000000',2),(3,'Irfan','m1y4ru5','m1y4ru5@gmail.com','$2b$10$99W98oH2OGq9dNGnTeOuYe6f.9Q.GH96Q/hh/6z4A/PC8qikzqz16','admin','MTY0ODg5OTY2MTQ1MklNRzIwMjExMjA2MDgxMDA.jpg','2022-03-16 16:15:20.300907','2022-04-07 16:01:03.000000',3),(4,'ALOHA','aloha','aloha@rajadinar.com','$2b$10$.ZLtGXvxyNmJsLjPEIrasOq5upNXKw48wC4VAVpEuU7ds.1jAY8Ku','sistem',NULL,'2022-03-25 01:42:04.611196','2022-03-25 01:42:04.611196',NULL),(5,'PukaPuka','crm','crm@rajadinar.com','$2b$10$R3hXdt9EQXmip.lv4NEAbewTtgkfKlkFFvN/mt/sYM0k8Sy/D/xfW','sistem',NULL,'2022-03-25 01:42:28.287569','2022-03-25 01:42:28.287569',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_agent`
--

DROP TABLE IF EXISTS `customer_agent`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2829 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--
--
-- Table structure for table `message_template`
--

DROP TABLE IF EXISTS `message_template`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message_template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `template` varchar(255) NOT NULL,
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_template`
--

LOCK TABLES `message_template` WRITE;
/*!40000 ALTER TABLE `message_template` DISABLE KEYS */;
INSERT INTO `message_template` VALUES (1,'terimakasih','Terimakasih telah apa ya','2022-04-03 20:51:20.664492','2022-04-03 20:51:20.664492'),(2,'terimakasih','Terimakasih telah itu','2022-04-03 20:51:31.593613','2022-04-03 20:51:31.593613');
/*!40000 ALTER TABLE `message_template` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-04-08 11:18:02
