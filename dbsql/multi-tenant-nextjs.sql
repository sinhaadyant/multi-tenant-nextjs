-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Aug 11, 2025 at 08:18 AM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.0.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `multi-tenant-nextjs`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` varchar(191) NOT NULL,
  `action` varchar(191) NOT NULL,
  `details` longtext DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL,
  `userAgent` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `tenantId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `superAdminId` varchar(191) DEFAULT NULL,
  `archivedAt` datetime(3) DEFAULT NULL,
  `isArchived` tinyint(1) NOT NULL DEFAULT 0,
  `newValues` longtext DEFAULT NULL,
  `oldValues` longtext DEFAULT NULL,
  `requestId` varchar(191) DEFAULT NULL,
  `resourceId` varchar(191) DEFAULT NULL,
  `resourceType` varchar(191) DEFAULT NULL,
  `retentionExpiry` datetime(3) DEFAULT NULL,
  `sessionId` varchar(191) DEFAULT NULL,
  `severity` varchar(191) NOT NULL DEFAULT 'info',
  `status` varchar(191) NOT NULL DEFAULT 'success'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_logs`
--

INSERT INTO `audit_logs` (`id`, `action`, `details`, `ipAddress`, `userAgent`, `createdAt`, `tenantId`, `userId`, `superAdminId`, `archivedAt`, `isArchived`, `newValues`, `oldValues`, `requestId`, `resourceId`, `resourceType`, `retentionExpiry`, `sessionId`, `severity`, `status`) VALUES
('cme63jri1009uukmofpx81dsb', 'user_login', 'Sample audit log entry 1', '192.168.1.121', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-04 11:59:20.974', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jri4009wukmowx2oviyi', 'role_assigned', 'Sample audit log entry 2', '192.168.1.44', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-12 19:50:40.515', 'cme63jpac0002ukmonmpz2che', 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jri5009yukmo9q8emcpw', 'module_enabled', 'Sample audit log entry 3', '192.168.1.114', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-08 07:41:49.053', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jri600a0ukmo0ba3lmx8', 'permission_updated', 'Sample audit log entry 4', '192.168.1.239', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-29 15:39:02.443', 'cme63jpac0002ukmonmpz2che', 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jri700a2ukmoh3fqjxhh', 'module_enabled', 'Sample audit log entry 5', '192.168.1.54', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-02 04:51:30.936', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jria00a4ukmo08wlv2w6', 'role_assigned', 'Sample audit log entry 6', '192.168.1.84', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-27 16:55:10.747', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrib00a6ukmo9ikcrv21', 'role_assigned', 'Sample audit log entry 7', '192.168.1.61', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-01 16:48:23.979', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrid00a8ukmossmc7rxn', 'user_login', 'Sample audit log entry 8', '192.168.1.137', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-06 15:20:28.299', 'cme63jpac0002ukmonmpz2che', 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrif00aaukmodr7udp3j', 'permission_updated', 'Sample audit log entry 9', '192.168.1.243', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-28 07:18:31.289', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jrig00acukmogripwyqr', 'role_assigned', 'Sample audit log entry 10', '192.168.1.251', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-15 10:32:18.170', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrih00aeukmo1o7qmz6d', 'module_enabled', 'Sample audit log entry 11', '192.168.1.62', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-25 03:18:46.328', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jrii00agukmo5ayzymvc', 'user_created', 'Sample audit log entry 12', '192.168.1.86', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-20 20:30:38.374', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrik00aiukmog8yy6tho', 'permission_updated', 'Sample audit log entry 13', '192.168.1.195', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-31 12:51:54.980', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jril00akukmol5d2cgcn', 'permission_updated', 'Sample audit log entry 14', '192.168.1.6', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-12 15:20:58.437', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jrim00amukmo2rz0f5c0', 'user_created', 'Sample audit log entry 15', '192.168.1.7', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-06 05:52:03.690', 'cme63jpac0001ukmof66twwc2', 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrin00aoukmomajahcbi', 'module_enabled', 'Sample audit log entry 16', '192.168.1.98', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-02 10:10:59.585', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jrio00aqukmof67jpe6v', 'role_assigned', 'Sample audit log entry 17', '192.168.1.233', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-27 06:49:45.170', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jriq00asukmoz9zyen7m', 'support_ticket_created', 'Sample audit log entry 18', '192.168.1.126', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-24 13:45:47.014', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'support', NULL, NULL, 'info', 'success'),
('cme63jris00auukmonov1yj3g', 'user_created', 'Sample audit log entry 19', '192.168.1.109', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-10 19:18:01.746', 'cme63jpac0002ukmonmpz2che', 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jriu00awukmoeno3dus3', 'user_created', 'Sample audit log entry 20', '192.168.1.43', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-17 20:25:58.498', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrix00ayukmofyr6njgk', 'support_ticket_created', 'Sample audit log entry 21', '192.168.1.32', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-22 12:20:42.121', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'support', NULL, NULL, 'info', 'success'),
('cme63jriy00b0ukmorohmx1fy', 'user_created', 'Sample audit log entry 22', '192.168.1.239', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-23 09:24:07.908', 'cme63jpac0001ukmof66twwc2', 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jriz00b2ukmombpnxe58', 'role_assigned', 'Sample audit log entry 23', '192.168.1.62', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-21 16:29:46.319', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrj000b4ukmo8sotnpfi', 'user_login', 'Sample audit log entry 24', '192.168.1.181', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-02 06:06:15.885', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrj000b6ukmou4g187v5', 'role_assigned', 'Sample audit log entry 25', '192.168.1.121', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-06 17:54:30.754', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrj100b8ukmoq284mbv7', 'module_enabled', 'Sample audit log entry 26', '192.168.1.142', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-31 11:51:08.305', 'cme63jpac0002ukmonmpz2che', 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jrj200baukmorkypqjkh', 'module_enabled', 'Sample audit log entry 27', '192.168.1.230', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-14 09:04:36.388', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jrj300bcukmox6g32ftj', 'support_ticket_created', 'Sample audit log entry 28', '192.168.1.182', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-26 16:47:43.752', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'support', NULL, NULL, 'info', 'success'),
('cme63jrj400beukmooxi0wt8y', 'user_login', 'Sample audit log entry 29', '192.168.1.113', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-22 22:03:03.777', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrj400bgukmolozm2lhs', 'user_login', 'Sample audit log entry 30', '192.168.1.244', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-29 15:35:03.941', 'cme63jpac0002ukmonmpz2che', 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrj500biukmoefuzeqkj', 'module_enabled', 'Sample audit log entry 31', '192.168.1.111', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-15 23:14:33.356', 'cme63jpac0001ukmof66twwc2', 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jrj600bkukmo3h9o6gij', 'permission_updated', 'Sample audit log entry 32', '192.168.1.254', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-01 06:38:53.965', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jrj700bmukmo5r5xa2tx', 'permission_updated', 'Sample audit log entry 33', '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-30 09:45:58.390', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jrj700boukmo8378glsm', 'role_assigned', 'Sample audit log entry 34', '192.168.1.242', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-05 09:21:18.101', 'cme63jpac0002ukmonmpz2che', 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrj800bqukmonx070191', 'user_login', 'Sample audit log entry 35', '192.168.1.161', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-02 19:11:30.551', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrja00bsukmo2v7ugkgd', 'permission_updated', 'Sample audit log entry 36', '192.168.1.218', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-23 14:03:12.137', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jrjb00buukmow2iqfedu', 'support_ticket_created', 'Sample audit log entry 37', '192.168.1.41', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-31 21:49:47.995', 'cme63jpac0002ukmonmpz2che', 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'support', NULL, NULL, 'info', 'success'),
('cme63jrjc00bwukmox2zo9esf', 'user_created', 'Sample audit log entry 38', '192.168.1.37', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-25 14:20:31.084', 'cme63jpac0002ukmonmpz2che', 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrjd00byukmolru5hx8e', 'role_assigned', 'Sample audit log entry 39', '192.168.1.17', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-26 07:06:21.139', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrje00c0ukmoy6oqyiex', 'permission_updated', 'Sample audit log entry 40', '192.168.1.200', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-10 16:52:56.624', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jrje00c2ukmon5a55vc5', 'user_created', 'Sample audit log entry 41', '192.168.1.221', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-23 02:47:38.374', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrjf00c4ukmoco0gvsyq', 'role_assigned', 'Sample audit log entry 42', '192.168.1.118', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-26 06:47:35.672', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrjg00c6ukmo4whr8ca1', 'user_created', 'Sample audit log entry 43', '192.168.1.196', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-14 11:20:43.020', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrjg00c8ukmo4higtorx', 'permission_updated', 'Sample audit log entry 44', '192.168.1.1', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-13 14:23:29.220', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'permission', NULL, NULL, 'warning', 'success'),
('cme63jrjh00caukmo88w6jfqk', 'module_enabled', 'Sample audit log entry 45', '192.168.1.93', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-16 10:09:42.358', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'module', NULL, NULL, 'info', 'success'),
('cme63jrji00ccukmou5mzbaxr', 'user_login', 'Sample audit log entry 46', '192.168.1.108', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-19 23:17:38.135', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrjj00ceukmoipexej0d', 'user_created', 'Sample audit log entry 47', '192.168.1.201', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-27 17:25:45.620', 'cme63jpac0002ukmonmpz2che', 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrjk00cgukmo68bhqdkv', 'user_login', 'Sample audit log entry 48', '192.168.1.197', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-19 19:20:34.318', 'cme63jpac0001ukmof66twwc2', 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'user', NULL, NULL, 'info', 'success'),
('cme63jrjl00ciukmofvjzhng9', 'role_assigned', 'Sample audit log entry 49', '192.168.1.213', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-07-26 19:03:35.069', 'cme63jpac0002ukmonmpz2che', 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63jrjl00ckukmomkfdlxn1', 'role_assigned', 'Sample audit log entry 50', '192.168.1.107', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', '2025-08-03 03:58:04.717', 'cme63jpac0002ukmonmpz2che', 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, 'role', NULL, NULL, 'info', 'success'),
('cme63ugxb0001ukmzwwo1ezwu', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36', '2025-08-10 19:57:00.333', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 19:57:00.330', NULL, 'info', 'success'),
('cme648qyt0001uk9hbqiuqfiu', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:08:06.532', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:08:06.530', NULL, 'info', 'success'),
('cme64aaq60003uk9hk5d5hzhy', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:09:18.793', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:09:18.790', NULL, 'info', 'success'),
('cme64azqq0005uk9hs2nefb5y', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:09:51.211', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:09:51.209', NULL, 'info', 'success'),
('cme64bfkj0007uk9hrqfua7wp', 'user.login', '{\"email\":\"admin@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:10:11.730', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:10:11.727', NULL, 'info', 'success'),
('cme64bre40009uk9hlpoavq50', 'user.login', '{\"email\":\"manager@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:10:27.053', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:10:27.052', NULL, 'info', 'success'),
('cme64c64c000buk9h1i5lapj9', 'user.login', '{\"email\":\"user@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:10:46.140', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:10:46.138', NULL, 'info', 'success'),
('cme64cmfp000duk9hyxe8ffir', 'user.login', '{\"email\":\"viewer@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:11:07.285', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:11:07.283', NULL, 'info', 'success'),
('cme64ksfs000fuk9hy2phe12k', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:17:28.311', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:17:28.307', NULL, 'info', 'success'),
('cme64l2jq000huk9hwnhn2uha', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:17:41.414', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:17:41.412', NULL, 'info', 'success'),
('cme64lezq000juk9h0ol77mn6', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:17:57.540', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:17:57.538', NULL, 'info', 'success'),
('cme64lqng000luk9hjvhbpqft', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:18:12.652', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:18:12.651', NULL, 'info', 'success'),
('cme64mbiu000nuk9h1u03m96g', 'user.login', '{\"email\":\"admin@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:18:39.702', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:18:39.701', NULL, 'info', 'success'),
('cme64mnm9000puk9h4flt4ku0', 'user.login', '{\"email\":\"manager@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:18:55.377', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:18:55.374', NULL, 'info', 'success'),
('cme64mx8c000ruk9hi25l1eo9', 'user.login', '{\"email\":\"user@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:19:07.836', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:19:07.833', NULL, 'info', 'success'),
('cme64nj8w000tuk9hi2toi3af', 'user.login', '{\"email\":\"viewer@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 20:19:36.368', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 20:19:36.367', NULL, 'info', 'success'),
('cme67ezn10001uk0uddrvqs6l', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:36:56.554', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:36:56.553', NULL, 'info', 'success'),
('cme67h4ge0003uk0uvdeaoj18', 'user.login', '{\"email\":\"manager@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:38:36.109', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:38:36.107', NULL, 'info', 'success'),
('cme67mm1b0005uk0ubdq8vuq5', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:42:52.163', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:42:52.159', NULL, 'info', 'success'),
('cme67mx8z0007uk0u651a3p5c', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:43:06.707', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:43:06.700', NULL, 'info', 'success'),
('cme67mzhl0009uk0udi40ijhq', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:43:09.609', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:43:09.608', NULL, 'info', 'success'),
('cme67nwzz000buk0ucqfhy78u', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:43:53.032', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:43:53.021', NULL, 'info', 'success'),
('cme67nxvw000duk0u2i7xmpxu', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:43:54.188', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:43:54.186', NULL, 'info', 'success'),
('cme67nxzi000fuk0udgft3tq9', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:43:54.318', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:43:54.317', NULL, 'info', 'success'),
('cme67ou1s000huk0ujz5pddvm', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:44:35.870', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:44:35.866', NULL, 'info', 'success'),
('cme67owlj000juk0ufs33hsyj', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:44:39.175', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:44:39.173', NULL, 'info', 'success'),
('cme67owvm000luk0uhko5gbpx', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:44:39.538', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:44:39.535', NULL, 'info', 'success'),
('cme67p6gb000nuk0ucur5vijv', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:44:51.946', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:44:51.939', NULL, 'info', 'success'),
('cme67pkte000puk0uhdv55qmz', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:45:10.558', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:45:10.556', NULL, 'info', 'success'),
('cme67q03n000ruk0um1zu5oac', 'user.login', '{\"email\":\"admin@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:45:30.370', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:45:30.368', NULL, 'info', 'success'),
('cme67q3kc000tuk0ub5t3ze8a', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:45:34.860', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:45:34.859', NULL, 'info', 'success'),
('cme67q3mp000vuk0uo43knsx7', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:45:34.945', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:45:34.943', NULL, 'info', 'success'),
('cme67tka6000xuk0uan1vmva2', 'user.login', '{\"email\":\"manager@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:48:16.482', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:48:16.467', NULL, 'info', 'success'),
('cme67trb0000zuk0ugmmrrt6q', 'user.login', '{\"email\":\"viewer@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:48:25.583', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:48:25.572', NULL, 'info', 'success'),
('cme67tssa0011uk0ulfos1cje', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:48:27.514', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:48:27.512', NULL, 'info', 'success'),
('cme67tsxu0013uk0uopnwymyd', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:48:27.714', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:48:27.711', NULL, 'info', 'success'),
('cme67wbi20017uk0u1bs0y2eb', 'superadmin.password_reset_requested', '{\"email\":\"admin@superadmin.com\"}', '::1', 'node', '2025-08-10 21:50:25.082', NULL, NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:50:25.078', NULL, 'info', 'success'),
('cme685dxv0019uk0uwm1tyqlb', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:57:28.146', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:57:28.145', NULL, 'info', 'success'),
('cme685j25001buk0u5z6rl0pn', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:57:34.781', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:57:34.780', NULL, 'info', 'success'),
('cme685k66001duk0u4lsh5y8p', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:57:36.222', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:57:36.221', NULL, 'info', 'success'),
('cme685kzf001fuk0ud236ki9t', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:57:37.275', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:57:37.264', NULL, 'info', 'success'),
('cme685l3t001huk0u9o7xvxpp', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:57:37.433', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:57:37.431', NULL, 'info', 'success'),
('cme685zkd001juk0ub0ywiulx', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:57:56.173', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:57:56.171', NULL, 'info', 'success'),
('cme685zlh001luk0ur94ltahu', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:57:56.214', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:57:56.213', NULL, 'info', 'success'),
('cme686o3y001nuk0ulr1pba7d', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:58:27.981', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:58:27.980', NULL, 'info', 'success'),
('cme686oa3001puk0uhwosz82n', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:58:28.204', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:58:28.203', NULL, 'info', 'success'),
('cme686obe001ruk0ufmeulbsf', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:58:28.250', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:58:28.248', NULL, 'info', 'success'),
('cme686pb3001tuk0uckmv7umy', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:58:29.535', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:58:29.533', NULL, 'info', 'success'),
('cme686plx001vuk0uv55ru8qv', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:58:29.924', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:58:29.917', NULL, 'info', 'success'),
('cme6874ak001xuk0uvalntts4', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:58:48.956', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:58:48.953', NULL, 'info', 'success'),
('cme68751u001zuk0upbemfkox', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:58:49.938', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:58:49.937', NULL, 'info', 'success'),
('cme687jab0021uk0u7zormmh5', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:08.387', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:08.387', NULL, 'info', 'success'),
('cme687jfi0023uk0u943kbhfp', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:08.574', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:08.573', NULL, 'info', 'success'),
('cme687jgi0025uk0u9cfoj1m9', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:08.610', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:08.609', NULL, 'info', 'success'),
('cme687k230027uk0u8uiamx05', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:09.388', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:09.387', NULL, 'info', 'success'),
('cme687k360029uk0u0c9dv03y', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:09.426', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:09.426', NULL, 'info', 'success'),
('cme687xs6002buk0u66r0ie16', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:27.174', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:27.172', NULL, 'info', 'success'),
('cme687xvu002duk0ul4e3dfi2', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:27.307', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:27.306', NULL, 'info', 'success'),
('cme688bu2002fuk0uhny3ko3b', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:45.387', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:45.386', NULL, 'info', 'success'),
('cme688byf002huk0u7hiqy0tc', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:45.544', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:45.543', NULL, 'info', 'success'),
('cme688bzq002juk0uldjv5ujq', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:45.590', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:45.589', NULL, 'info', 'success'),
('cme688cgi002luk0uvqase3qb', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:46.194', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:46.193', NULL, 'info', 'success'),
('cme688chh002nuk0unk7fuk1d', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 21:59:46.229', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 21:59:46.228', NULL, 'info', 'success'),
('cme688sfv002puk0upg0k5o2p', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:06.902', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:06.900', NULL, 'info', 'success'),
('cme688sp6002ruk0uxzzc89m2', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:07.242', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:07.240', NULL, 'info', 'success'),
('cme6896rq002tuk0u8jmsj5sv', 'user.login', '{\"email\":\"admin@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:25.478', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:25.477', NULL, 'info', 'success');
INSERT INTO `audit_logs` (`id`, `action`, `details`, `ipAddress`, `userAgent`, `createdAt`, `tenantId`, `userId`, `superAdminId`, `archivedAt`, `isArchived`, `newValues`, `oldValues`, `requestId`, `resourceId`, `resourceType`, `retentionExpiry`, `sessionId`, `severity`, `status`) VALUES
('cme68971v002vuk0u4vnl5smu', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:25.844', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:25.842', NULL, 'info', 'success'),
('cme68974c002xuk0u2z55l3fe', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:25.932', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:25.931', NULL, 'info', 'success'),
('cme6897jc002zuk0uip3adbsc', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:26.473', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:26.471', NULL, 'info', 'success'),
('cme6897kd0031uk0ukbnkp8n5', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:26.509', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:26.507', NULL, 'info', 'success'),
('cme689l650033uk0uxj9zuxn6', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:44.141', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:44.140', NULL, 'info', 'success'),
('cme689l710035uk0uw21b2q6u', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:00:44.173', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:00:44.172', NULL, 'info', 'success'),
('cme68a0dv0037uk0u7r8u9sig', 'user.login', '{\"email\":\"manager@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:03.859', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:03.858', NULL, 'info', 'success'),
('cme68a0j70039uk0umfcdtcr8', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:04.051', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:04.050', NULL, 'info', 'success'),
('cme68a0m3003buk0uy0jnrnch', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:04.155', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:04.154', NULL, 'info', 'success'),
('cme68a11j003duk0u4qu5sd9l', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:04.712', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:04.711', NULL, 'info', 'success'),
('cme68a12n003fuk0um60r7yqw', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:04.751', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:04.750', NULL, 'info', 'success'),
('cme68aemg003huk0uf0ysj9p6', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:22.312', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:22.311', NULL, 'info', 'success'),
('cme68aeni003juk0uas3uentu', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:22.350', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:22.349', NULL, 'info', 'success'),
('cme68asyj003luk0ufktj07dr', 'user.login', '{\"email\":\"user@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:40.891', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:40.891', NULL, 'info', 'success'),
('cme68at54003nuk0uwdwnd3tx', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:41.128', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:41.128', NULL, 'info', 'success'),
('cme68at5r003puk0uckx9s352', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:41.151', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:41.150', NULL, 'info', 'success'),
('cme68atpr003ruk0u7mnvb707', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:41.872', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:41.870', NULL, 'info', 'success'),
('cme68atqn003tuk0ubbu3f4ao', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:01:41.903', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:01:41.903', NULL, 'info', 'success'),
('cme68b8v6003vuk0ubt5tslj2', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:01.504', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:01.502', NULL, 'info', 'success'),
('cme68b8z0003xuk0uunn6hy1n', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:01.644', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:01.642', NULL, 'info', 'success'),
('cme68bnai003zuk0ulb2h1eht', 'user.login', '{\"email\":\"viewer@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:20.202', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:20.202', NULL, 'info', 'success'),
('cme68bnfa0041uk0u3agtp9iq', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:20.374', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:20.373', NULL, 'info', 'success'),
('cme68bng90043uk0uher59uya', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:20.409', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:20.408', NULL, 'info', 'success'),
('cme68bpo50045uk0uhd4lkpgl', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:23.285', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:23.277', NULL, 'info', 'success'),
('cme68bppl0047uk0umu9u54n1', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:23.338', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:23.336', NULL, 'info', 'success'),
('cme68c25m0049uk0ualgj9mau', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:39.466', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:39.465', NULL, 'info', 'success'),
('cme68c26l004buk0u4sqte9wp', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:02:39.502', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:02:39.501', NULL, 'info', 'success'),
('cme68ik1n004duk0uxvq6e600', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:07:42.587', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:07:42.586', NULL, 'info', 'success'),
('cme68im33004fuk0u118lx34i', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:07:45.231', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:07:45.230', NULL, 'info', 'success'),
('cme68im34004huk0uatm9pueg', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:07:45.232', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:07:45.231', NULL, 'info', 'success'),
('cme68imds004juk0ufwj2ieae', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:07:45.616', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:07:45.609', NULL, 'info', 'success'),
('cme68imzd004luk0uw51ky6g2', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:07:46.393', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:07:46.392', NULL, 'info', 'success'),
('cme68imzs004nuk0uimh5kaj0', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:07:46.408', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:07:46.407', NULL, 'info', 'success'),
('cme68in0u004puk0u14bv5eqw', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:07:46.446', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:07:46.445', NULL, 'info', 'success'),
('cme68j00m004ruk0upasfrmld', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:03.287', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:03.285', NULL, 'info', 'success'),
('cme68j00n004tuk0uwifx1xjx', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:03.287', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:03.287', NULL, 'info', 'success'),
('cme68j02g004vuk0urh7ywrx0', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:03.352', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:03.351', NULL, 'info', 'success'),
('cme68je6n004xuk0ue4ozrjnn', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:21.647', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:21.646', NULL, 'info', 'success'),
('cme68jec0004zuk0udsl9u1e4', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:21.840', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:21.839', NULL, 'info', 'success'),
('cme68jec10051uk0uufl3v60f', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:21.841', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:21.840', NULL, 'info', 'success'),
('cme68jefv0053uk0uyfw3193p', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:21.979', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:21.978', NULL, 'info', 'success'),
('cme68jf0y0055uk0udrzxpq9s', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:22.738', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:22.737', NULL, 'info', 'success'),
('cme68jf100057uk0ulmoby8ur', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:22.740', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:22.739', NULL, 'info', 'success'),
('cme68jf220059uk0u8gatbn5z', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:22.778', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:22.778', NULL, 'info', 'success'),
('cme68jt5c005buk0us1eysghq', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:41.040', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:41.039', NULL, 'info', 'success'),
('cme68jt5f005duk0ulo9qyne3', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:41.043', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:41.042', NULL, 'info', 'success'),
('cme68jt7m005fuk0ut0mb4npf', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:41.122', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:41.121', NULL, 'info', 'success'),
('cme68k6ct005huk0urrito13b', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:58.157', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:58.156', NULL, 'info', 'success'),
('cme68k6ht005juk0u3fcdm7qb', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:58.337', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:58.337', NULL, 'info', 'success'),
('cme68k6hy005luk0uvvmlcmv7', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:58.342', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:58.341', NULL, 'info', 'success'),
('cme68k6j7005nuk0ueffvd44y', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:58.388', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:58.387', NULL, 'info', 'success'),
('cme68k76s005puk0ueo8evdrq', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:59.236', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:59.235', NULL, 'info', 'success'),
('cme68k771005ruk0uu25h13di', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:59.245', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:59.245', NULL, 'info', 'success'),
('cme68k788005tuk0ui34h1cxe', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:08:59.288', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:08:59.288', NULL, 'info', 'success'),
('cme68kksf005vuk0ushkjoi1g', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:16.863', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:16.862', NULL, 'info', 'success'),
('cme68kkso005xuk0u485sps78', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:16.873', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:16.872', NULL, 'info', 'success'),
('cme68kktq005zuk0uhp97fur5', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:16.910', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:16.909', NULL, 'info', 'success'),
('cme68kyo20061uk0uh1hl42yt', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:34.850', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:34.849', NULL, 'info', 'success'),
('cme68kytz0063uk0u2740vg90', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:35.063', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:35.062', NULL, 'info', 'success'),
('cme68kyu20065uk0u30jk1jv3', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:35.066', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:35.065', NULL, 'info', 'success'),
('cme68kyve0067uk0uzwh24zpt', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:35.113', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:35.112', NULL, 'info', 'success'),
('cme68l12h0069uk0uq59oxd85', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:37.961', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:37.959', NULL, 'info', 'success'),
('cme68l12n006buk0usfl1sz99', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:37.967', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:37.965', NULL, 'info', 'success'),
('cme68l16r006duk0utreafazd', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:38.115', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:38.113', NULL, 'info', 'success'),
('cme68ldxq006fuk0uj7279ogx', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:54.639', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:54.638', NULL, 'info', 'success'),
('cme68ldxr006huk0ucw2mmjdq', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:54.640', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:54.639', NULL, 'info', 'success'),
('cme68ldz9006juk0u2bsifke5', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:09:54.693', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:09:54.693', NULL, 'info', 'success'),
('cme68lrxb006luk0uezi2wjdo', 'user.login', '{\"email\":\"admin@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:12.767', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:12.766', NULL, 'info', 'success'),
('cme68ls1q006nuk0uyv3mg43e', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:12.926', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:12.925', NULL, 'info', 'success'),
('cme68ls1s006puk0unz1s5mw9', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:12.928', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:12.927', NULL, 'info', 'success'),
('cme68ls3i006ruk0ucyk7540h', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:12.990', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:12.990', NULL, 'info', 'success'),
('cme68lsnt006tuk0u0zfxa5pa', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:13.721', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:13.720', NULL, 'info', 'success'),
('cme68lso1006vuk0unv0mko6t', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:13.730', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:13.729', NULL, 'info', 'success'),
('cme68lsp7006xuk0ua13vsooi', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:13.771', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:13.770', NULL, 'info', 'success'),
('cme68m8dz006zuk0u0dtvhh3g', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:34.103', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:34.101', NULL, 'info', 'success'),
('cme68m8ec0071uk0u2jay7j58', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:34.116', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:34.111', NULL, 'info', 'success'),
('cme68m8hl0073uk0ux4cw5qra', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:34.233', NULL, 'cme63jqr00078ukmo0su3pk9p', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:34.230', NULL, 'info', 'success'),
('cme68mm3z0075uk0ubcairiyn', 'user.login', '{\"email\":\"manager@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:51.887', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:51.886', NULL, 'info', 'success'),
('cme68mmb00077uk0uum2svno9', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:52.140', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:52.136', NULL, 'info', 'success'),
('cme68mmb70079uk0um0e4pttu', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:52.147', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:52.145', NULL, 'info', 'success'),
('cme68mmcq007buk0usrz0n0zv', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:52.202', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:52.201', NULL, 'info', 'success'),
('cme68mn1d007duk0ul1mdczlf', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:53.089', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:53.089', NULL, 'info', 'success'),
('cme68mn1e007fuk0utmoalm0q', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:53.091', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:53.090', NULL, 'info', 'success'),
('cme68mn3g007huk0umlal8amd', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:10:53.164', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:10:53.163', NULL, 'info', 'success'),
('cme68n0oz007juk0u1c8jvlqw', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:10.788', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:10.786', NULL, 'info', 'success'),
('cme68n0p1007luk0u165tpn5j', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:10.789', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:10.789', NULL, 'info', 'success'),
('cme68n0q3007nuk0ua1sfi330', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:10.827', NULL, 'cme63jqzi007cukmo2hdzxk7k', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:10.826', NULL, 'info', 'success'),
('cme68neld007puk0u4btnx7rp', 'user.login', '{\"email\":\"user@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:28.801', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:28.800', NULL, 'info', 'success'),
('cme68nes9007ruk0ua55wiho8', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:29.050', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:29.048', NULL, 'info', 'success'),
('cme68nesb007tuk0ushmftv79', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:29.051', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:29.050', NULL, 'info', 'success'),
('cme68neuz007vuk0u007iplf4', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:29.147', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:29.143', NULL, 'info', 'success'),
('cme68nfhq007xuk0u2qkdy7qi', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:29.967', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:29.966', NULL, 'info', 'success'),
('cme68nfhy007zuk0upm4iwe8j', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:29.974', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:29.973', NULL, 'info', 'success'),
('cme68nfiw0081uk0uyq2xoml1', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:30.008', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:30.006', NULL, 'info', 'success'),
('cme68ntfa0083uk0ug2obvtj1', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:48.022', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:48.021', NULL, 'info', 'success');
INSERT INTO `audit_logs` (`id`, `action`, `details`, `ipAddress`, `userAgent`, `createdAt`, `tenantId`, `userId`, `superAdminId`, `archivedAt`, `isArchived`, `newValues`, `oldValues`, `requestId`, `resourceId`, `resourceType`, `retentionExpiry`, `sessionId`, `severity`, `status`) VALUES
('cme68ntfp0085uk0u6o3bz93s', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:48.037', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:48.036', NULL, 'info', 'success'),
('cme68nthg0087uk0ueacdnzsf', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:11:48.100', NULL, 'cme63jr7x007gukmomcn4sqql', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:11:48.099', NULL, 'info', 'success'),
('cme68o7p20089uk0uze973dx0', 'user.login', '{\"email\":\"viewer@globalretail.com\",\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:06.519', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:06.518', NULL, 'info', 'success'),
('cme68o7ua008buk0u9fct0dgx', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:06.706', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:06.705', NULL, 'info', 'success'),
('cme68o7uc008duk0u8zdmpveh', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:06.709', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:06.708', NULL, 'info', 'success'),
('cme68o7wg008fuk0uzelb3xps', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:06.785', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:06.783', NULL, 'info', 'success'),
('cme68o8kq008huk0u4flgn9nw', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:07.658', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:07.655', NULL, 'info', 'success'),
('cme68o8kt008juk0ullmaa5q0', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:07.661', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:07.660', NULL, 'info', 'success'),
('cme68o8lv008luk0uukyru3zh', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:07.700', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:07.699', NULL, 'info', 'success'),
('cme68om8k008nuk0umkb2zoqb', 'dashboard.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"tenantSlug\":\"globalretail\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:25.364', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:25.360', NULL, 'info', 'success'),
('cme68om8n008puk0uh8rih0px', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:25.367', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:25.366', NULL, 'info', 'success'),
('cme68om9o008ruk0u7lzlhio1', 'audit.view', '{\"tenantId\":\"cme63jpac0002ukmonmpz2che\",\"logsCount\":20,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:12:25.405', NULL, 'cme63jrg9007kukmow1k7dnk2', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:12:25.404', NULL, 'info', 'success'),
('cme6938iv008tuk0u8odumduj', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:23:47.430', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:23:47.429', NULL, 'info', 'success'),
('cme6938pq008vuk0unyilv3iq', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:23:47.678', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:23:47.677', NULL, 'info', 'success'),
('cme6938qg008xuk0ubrsi5t0a', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:23:47.704', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:23:47.703', NULL, 'info', 'success'),
('cme6938u9008zuk0ui0c9ni8u', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:23:47.841', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:23:47.840', NULL, 'info', 'success'),
('cme693iaf0091uk0urz7qjy66', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:24:00.088', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:24:00.087', NULL, 'info', 'success'),
('cme69498d0093uk0up9uvxseb', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:24:35.004', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:24:34.997', NULL, 'info', 'success'),
('cme696ogb0095uk0u8t5kyf0e', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:26:28.042', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:26:28.041', NULL, 'info', 'success'),
('cme696ov30097uk0u0zttbx1t', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:26:28.575', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:26:28.574', NULL, 'info', 'success'),
('cme696oxs0099uk0u5ro41rl4', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:26:28.673', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:26:28.671', NULL, 'info', 'success'),
('cme696yf6009buk0uycmfzk88', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:26:40.963', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:26:40.962', NULL, 'info', 'success'),
('cme697nx7009duk0ucw0yo1wj', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:27:14.010', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:27:14.007', NULL, 'info', 'success'),
('cme699sti009fuk0ubeaiexv6', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:28:53.670', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:28:53.669', NULL, 'info', 'success'),
('cme699t37009huk0uz2vlov9j', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:28:54.019', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:28:54.018', NULL, 'info', 'success'),
('cme699t37009juk0ux6ujr26i', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:28:54.020', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:28:54.019', NULL, 'info', 'success'),
('cme699t8v009luk0utvtib6kb', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:28:54.223', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:28:54.222', NULL, 'info', 'success'),
('cme69a2m6009nuk0uubqevz7c', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:29:06.366', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:29:06.365', NULL, 'info', 'success'),
('cme69c2mj009puk0u6xmk46yd', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:30:39.691', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:30:39.690', NULL, 'info', 'success'),
('cme69c2s4009ruk0uk533ycb5', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:30:39.892', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:30:39.891', NULL, 'info', 'success'),
('cme69c2s8009tuk0us7v1rsx0', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:30:39.896', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:30:39.895', NULL, 'info', 'success'),
('cme69c2ur009vuk0uk62u6iy1', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:30:39.986', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:30:39.976', NULL, 'info', 'success'),
('cme69cccn009xuk0usuwd9qew', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:30:52.295', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:30:52.295', NULL, 'info', 'success'),
('cme69ynrc0001ukhp495m3r3c', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:48:13.512', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:13.511', NULL, 'info', 'success'),
('cme69yqsj0003ukhpw8g72b7s', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:48:17.443', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:17.442', NULL, 'info', 'success'),
('cme69yqte0005ukhph1nk53jn', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:48:17.474', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:17.473', NULL, 'info', 'success'),
('cme69yqut0007ukhp8xy2ssan', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:48:17.524', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:17.522', NULL, 'info', 'success'),
('cme69yqv60009ukhptli6qgfu', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:48:17.538', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:17.537', NULL, 'info', 'success'),
('cme69yqxj000bukhp3nhus0k6', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:48:17.623', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:17.622', NULL, 'info', 'success'),
('cme69z0nx000dukhpsetik5er', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:48:30.238', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:30.237', NULL, 'info', 'success'),
('cme69zehh000fukhpf11bb2wv', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:48:48.149', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:48:48.148', NULL, 'info', 'success'),
('cme6a0455000hukhpyrxfzg7u', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:21.401', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:21.401', NULL, 'info', 'success'),
('cme6a04ae000jukhph6aaxpg8', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:21.591', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:21.589', NULL, 'info', 'success'),
('cme6a04am000lukhp571yxwlh', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:21.599', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:21.598', NULL, 'info', 'success'),
('cme6a04dy000nukhpgzpgyk82', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:21.718', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:21.717', NULL, 'info', 'success'),
('cme6a04un000pukhptg5y16bl', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:22.320', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:22.318', NULL, 'info', 'success'),
('cme6a04uq000rukhpel8eorhy', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:22.322', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:22.321', NULL, 'info', 'success'),
('cme6a04w6000tukhpaaea80qr', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:22.374', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:22.373', NULL, 'info', 'success'),
('cme6a0e3j000vukhpdc4db6j0', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:49:34.303', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:34.303', NULL, 'info', 'success'),
('cme6a0sr9000xukhpep6y9kes', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:49:53.301', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:49:53.299', NULL, 'info', 'success'),
('cme6a1el3000zukhp6lvfoiul', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:21.591', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:21.590', NULL, 'info', 'success'),
('cme6a1eqh0011ukhpj5qj4eam', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:21.785', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:21.783', NULL, 'info', 'success'),
('cme6a1er60013ukhpypsktonn', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:21.810', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:21.808', NULL, 'info', 'success'),
('cme6a1es50015ukhps1rfmriz', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:21.846', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:21.845', NULL, 'info', 'success'),
('cme6a1f9h0017ukhp71oqh8px', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:22.469', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:22.466', NULL, 'info', 'success'),
('cme6a1f9p0019ukhp58ebq0z3', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:22.477', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:22.476', NULL, 'info', 'success'),
('cme6a1fb6001bukhpqwobvxe0', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:22.530', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:22.529', NULL, 'info', 'success'),
('cme6a1ohr001dukhpvd92gu5i', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:50:34.432', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:34.431', NULL, 'info', 'success'),
('cme6a22hy001fukhpto1ex2t4', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:50:52.583', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:50:52.582', NULL, 'info', 'success'),
('cme6a2eao001hukhp7gaw86kl', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:07.872', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:07.872', NULL, 'info', 'success'),
('cme6a2efc001jukhpsox82d7b', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:08.040', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:08.039', NULL, 'info', 'success'),
('cme6a2eg2001lukhp48nxpw6o', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:08.067', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:08.065', NULL, 'info', 'success'),
('cme6a2ehi001nukhpjl4rgt4b', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:08.118', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:08.117', NULL, 'info', 'success'),
('cme6a2eyh001pukhpxkft2jr9', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:08.730', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:08.729', NULL, 'info', 'success'),
('cme6a2eyq001rukhp7crjd9rc', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:08.738', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:08.737', NULL, 'info', 'success'),
('cme6a2ezq001tukhpwq3h4okj', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:08.775', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:08.773', NULL, 'info', 'success'),
('cme6a2o6q001vukhpxtp2qxty', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:51:20.690', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:20.690', NULL, 'info', 'success'),
('cme6a3264001xukhpxnvv46tf', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":30,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:51:38.812', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:51:38.812', NULL, 'info', 'success'),
('cme6a6dr1001zukhpjqu5urau', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:54:13.790', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:54:13.789', NULL, 'info', 'success'),
('cme6a6x1p0021ukhpym8z5ue5', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:54:38.798', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:54:38.797', NULL, 'info', 'success'),
('cme6a7azt0023ukhp8t9lq4la', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:54:56.873', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:54:56.873', NULL, 'info', 'success'),
('cme6a7w170025ukhpxcsgvpqb', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:55:24.140', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:55:24.139', NULL, 'info', 'success'),
('cme6a8iuj0027ukhpjostxq4o', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:55:53.708', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:55:53.707', NULL, 'info', 'success'),
('cme6a8iwf0029ukhpyvr17ey0', 'users.list', '{\"page\":1,\"totalUsers\":4,\"filters\":{\"search\":\"\",\"status\":\"\",\"role\":\"\"}}', '::1', 'axios/1.11.0', '2025-08-10 22:55:53.776', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:55:53.775', NULL, 'info', 'success'),
('cme6a8zi8002bukhpxxy9nlad', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:15.296', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:15.295', NULL, 'info', 'success'),
('cme6a93sa002dukhp9t540faj', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:20.842', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:20.836', NULL, 'info', 'success'),
('cme6a93sb002fukhp2diamaro', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":31,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:20.843', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:20.840', NULL, 'info', 'success'),
('cme6a94dn002hukhpp5e34goa', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:21.612', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:21.611', NULL, 'info', 'success'),
('cme6a94e2002jukhpz3tk7j0h', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":31,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:21.626', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:21.625', NULL, 'info', 'success'),
('cme6a94hx002lukhp94k7svm2', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":31,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:21.765', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:21.763', NULL, 'info', 'success'),
('cme6a9dnk002nukhp5suy2nrt', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:56:33.633', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:33.632', NULL, 'info', 'success'),
('cme6a9rq8002pukhp49p2mli0', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":31,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:51.873', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:51.872', NULL, 'info', 'success'),
('cme6a9tvk002rukhpuornfn10', 'users.list', '{\"page\":1,\"totalUsers\":4,\"filters\":{\"search\":\"\",\"status\":\"\",\"role\":\"\"}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:56:54.656', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:56:54.655', NULL, 'info', 'success'),
('cme6aa2y5002tukhp4wt5w16w', 'users.list', '{\"page\":1,\"totalUsers\":4,\"filters\":{\"search\":\"\",\"status\":\"\",\"role\":\"\"}}', '::1', 'axios/1.11.0', '2025-08-10 22:57:06.413', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:06.412', NULL, 'info', 'success'),
('cme6aaefz002vukhpo7jjmdol', 'user.login', '{\"email\":\"manager@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:21.311', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:21.310', NULL, 'info', 'success'),
('cme6aaelk002xukhpmulhicvz', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":33,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:21.513', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:21.510', NULL, 'info', 'success'),
('cme6aaem1002zukhppiqcg581', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:21.529', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:21.528', NULL, 'info', 'success'),
('cme6aaen50031ukhpw53ugypq', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":33,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:21.569', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:21.568', NULL, 'info', 'success'),
('cme6aaf710033ukhpc2dqlgoq', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:22.285', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:22.284', NULL, 'info', 'success'),
('cme6aaf7h0035ukhpunnuu6sr', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":33,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:22.302', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:22.300', NULL, 'info', 'success'),
('cme6aaf9l0037ukhp98tnu2ev', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":33,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:22.377', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:22.374', NULL, 'info', 'success'),
('cme6aaoy50039ukhpea41j5en', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:57:34.925', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:34.924', NULL, 'info', 'success'),
('cme6ab2gn003bukhp3skpcsrl', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":33,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:52.439', NULL, 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:52.439', NULL, 'info', 'success'),
('cme6ab58b003dukhpeaorvime', 'users.list', '{\"page\":1,\"totalUsers\":4,\"filters\":{\"search\":\"\",\"status\":\"\",\"role\":\"\"}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:57:56.027', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:57:56.026', NULL, 'info', 'success'),
('cme6abeay003fukhpj3e6t5ms', 'users.list', '{\"page\":1,\"totalUsers\":4,\"filters\":{\"search\":\"\",\"status\":\"\",\"role\":\"\"}}', '::1', 'axios/1.11.0', '2025-08-10 22:58:07.786', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:07.785', NULL, 'info', 'success'),
('cme6abop4003hukhpkiwdkx0m', 'user.login', '{\"email\":\"user@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:21.256', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:21.255', NULL, 'info', 'success'),
('cme6aboub003jukhpebt42tpr', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:21.443', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:21.440', NULL, 'info', 'success'),
('cme6abov5003lukhpj0py8vl1', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:21.471', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:21.470', NULL, 'info', 'success'),
('cme6abox8003nukhpe9khhgy9', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:21.549', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:21.546', NULL, 'info', 'success'),
('cme6abpg8003qukhpripd5i2w', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:22.232', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:22.231', NULL, 'info', 'success'),
('cme6abpg8003rukhpy3dku63e', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:22.232', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:22.231', NULL, 'info', 'success'),
('cme6abpi5003tukhp5s8qh0ed', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:22.301', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:22.301', NULL, 'info', 'success'),
('cme6abyoo003vukhp44z49jbe', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:58:34.200', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:34.199', NULL, 'info', 'success'),
('cme6accog003xukhpfmssbe6r', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:58:52.336', NULL, 'cme63jqaj0070ukmowmdjlsxl', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:58:52.335', NULL, 'info', 'success'),
('cme6acnru003zukhpuau6tyv5', 'user.login', '{\"email\":\"viewer@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:06.714', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:06.714', NULL, 'info', 'success'),
('cme6acnw20041ukhpxdbaoze6', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:06.866', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:06.863', NULL, 'info', 'success');
INSERT INTO `audit_logs` (`id`, `action`, `details`, `ipAddress`, `userAgent`, `createdAt`, `tenantId`, `userId`, `superAdminId`, `archivedAt`, `isArchived`, `newValues`, `oldValues`, `requestId`, `resourceId`, `resourceType`, `retentionExpiry`, `sessionId`, `severity`, `status`) VALUES
('cme6acnwn0043ukhpfra5jneb', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:06.887', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:06.885', NULL, 'info', 'success'),
('cme6acnxx0045ukhptwuhhala', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:06.933', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:06.931', NULL, 'info', 'success'),
('cme6acojy0047ukhpayyu0jxw', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:07.727', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:07.726', NULL, 'info', 'success'),
('cme6acok40049ukhp1c5s272r', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:07.733', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:07.731', NULL, 'info', 'success'),
('cme6acolf004bukhp4y680qo5', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:07.779', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:07.777', NULL, 'info', 'success'),
('cme6acxty004dukhpa9skp5br', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-10 22:59:19.750', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:19.749', NULL, 'info', 'success'),
('cme6adbsu004fukhplkiq52ti', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":35,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-10 22:59:37.854', NULL, 'cme63jqir0074ukmoke8ownfr', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-10 22:59:37.853', NULL, 'info', 'success'),
('cme6nn2t80001ukomapkouual', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'axios/1.11.0', '2025-08-11 05:11:07.771', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:11:07.768', NULL, 'info', 'success'),
('cme6nn7qa0003ukomfgwdeyz8', 'users.list', '{\"page\":1,\"totalUsers\":4,\"filters\":{\"search\":\"\",\"status\":\"\",\"role\":\"\"}}', '::1', 'axios/1.11.0', '2025-08-11 05:11:14.145', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:11:14.143', NULL, 'info', 'success'),
('cme6no98u0005ukoma68crhcx', 'user.login', '{\"email\":\"admin@techcorp.com\",\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-11 05:12:02.761', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:12:02.758', NULL, 'info', 'success'),
('cme6noo150007ukomcba9bsop', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-11 05:12:21.929', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:12:21.928', NULL, 'info', 'success'),
('cme6noo190009ukom83qpd2cy', 'dashboard.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"tenantSlug\":\"techcorp\"}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-11 05:12:21.934', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:12:21.933', NULL, 'info', 'success'),
('cme6noo1c000bukomtnvfqnnb', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":36,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-11 05:12:21.936', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:12:21.935', NULL, 'info', 'success'),
('cme6noo1d000dukomcpo4p072', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":36,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-11 05:12:21.938', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:12:21.936', NULL, 'info', 'success'),
('cme6noo54000fukom3tppocqy', 'audit.view', '{\"tenantId\":\"cme63jpac0001ukmof66twwc2\",\"logsCount\":36,\"filters\":{\"userEmail\":\"\",\"actionType\":\"\",\"startDate\":\"\",\"endDate\":\"\",\"status\":\"\",\"severity\":\"\",\"resourceType\":\"\",\"page\":1,\"limit\":50}}', '::1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', '2025-08-11 05:12:22.073', NULL, 'cme63jpsv006sukmorpt3aim6', NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, '2026-08-11 05:12:22.072', NULL, 'info', 'success');

-- --------------------------------------------------------

--
-- Table structure for table `invite_tokens`
--

CREATE TABLE `invite_tokens` (
  `id` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `isUsed` tinyint(1) NOT NULL DEFAULT 0,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `superAdminId` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `modules`
--

CREATE TABLE `modules` (
  `id` varchar(191) NOT NULL,
  `moduleKey` varchar(191) NOT NULL,
  `moduleName` varchar(191) NOT NULL,
  `path` varchar(191) DEFAULT NULL,
  `icon` varchar(191) DEFAULT NULL,
  `parentModuleKey` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `isVisible` tinyint(1) NOT NULL DEFAULT 1,
  `orderIndex` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `maxVersion` varchar(191) DEFAULT NULL,
  `minVersion` varchar(191) DEFAULT NULL,
  `releaseNotes` text DEFAULT NULL,
  `version` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `modules`
--

INSERT INTO `modules` (`id`, `moduleKey`, `moduleName`, `path`, `icon`, `parentModuleKey`, `description`, `isActive`, `isVisible`, `orderIndex`, `createdAt`, `updatedAt`, `maxVersion`, `minVersion`, `releaseNotes`, `version`) VALUES
('clx1', 'dashboard', 'Dashboard', '/dashboard', 'LayoutDashboard', NULL, 'Main dashboard with overview and analytics', 1, 1, 1, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx11', 'user-management', 'User Management', '/users/management', 'UserCheck', 'users', 'Create, edit, and manage users', 1, 1, 1, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx12', 'role-management', 'Role Management', '/roles/management', 'ShieldCheck', 'roles', 'Create and manage roles', 1, 1, 1, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx13', 'permission-management', 'Permission Management', '/roles/permissions', 'Key', 'roles', 'Manage permissions and access rights', 1, 1, 2, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx2', 'users', 'User Management', '/users', 'Users', NULL, 'Manage tenant users, roles, and permissions', 1, 1, 2, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx3', 'roles', 'Roles & Permissions', '/roles', 'Shield', NULL, 'Manage roles and assign permissions', 1, 1, 3, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx5', 'audit', 'Audit Logs', '/audit', 'ClipboardList', NULL, 'View system audit logs and activity', 1, 1, 5, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx6', 'notifications', 'Notifications', '/notifications', 'Bell', NULL, 'Manage notifications and alerts', 1, 1, 6, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx7', 'settings', 'Settings', '/settings', 'Settings', NULL, 'System and tenant settings', 1, 1, 7, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx8', 'support', 'Support', '/support', 'LifeBuoy', NULL, 'Support tickets and help', 1, 1, 8, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('clx9', 'content', 'Content Management', '/content', 'FileText', NULL, 'Manage content and documents', 1, 1, 9, '2025-08-11 00:47:39.000', '2025-08-11 00:47:39.000', NULL, NULL, NULL, NULL),
('cme636je20000ukcxpb6ldn6l', 'modules', 'Module Management', '/modules', 'Cog', NULL, NULL, 1, 1, 4, '2025-08-10 19:38:23.787', '2025-08-10 19:38:23.787', NULL, NULL, NULL, NULL),
('cme63b2160008ukq1t3rpo3vr', 'reports', 'Reports & Analytics', '/reports', 'bar-chart', NULL, 'Generate reports and view analytics data', 1, 1, 5, '2025-08-10 19:41:54.570', '2025-08-10 19:41:54.570', NULL, NULL, NULL, '1.0.0');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(191) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `priority` varchar(191) NOT NULL DEFAULT 'medium',
  `targetTenantId` varchar(191) DEFAULT NULL,
  `targetType` varchar(191) NOT NULL DEFAULT 'superadmin',
  `attachments` text DEFAULT NULL,
  `createdByType` varchar(191) NOT NULL DEFAULT 'superadmin',
  `metadata` text DEFAULT NULL,
  `scheduledAt` datetime(3) DEFAULT NULL,
  `sentAt` datetime(3) DEFAULT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'draft',
  `type` varchar(191) NOT NULL DEFAULT 'info'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `title`, `message`, `isActive`, `createdAt`, `updatedAt`, `createdBy`, `priority`, `targetTenantId`, `targetType`, `attachments`, `createdByType`, `metadata`, `scheduledAt`, `sentAt`, `status`, `type`) VALUES
('cme63jrge007oukmozvbz7h37', 'Welcome to the Platform', 'Welcome to our multi-tenant platform! We\'re excited to have you on board.', 1, '2025-08-10 19:48:40.766', '2025-08-10 19:48:40.766', 'cme63jp9c0000ukmoylyi6jdy', 'medium', NULL, 'superadmin', NULL, 'superadmin', NULL, NULL, '2025-08-10 19:48:40.765', 'sent', 'info'),
('cme63jrgu0086ukmobzipvzdr', 'System Maintenance Scheduled', 'Scheduled maintenance will occur on Sunday at 2 AM EST. Expected downtime: 30 minutes.', 1, '2025-08-10 19:48:40.782', '2025-08-10 19:48:40.782', 'cme63jp9c0000ukmoylyi6jdy', 'high', NULL, 'superadmin', NULL, 'superadmin', NULL, NULL, '2025-08-10 19:48:40.765', 'sent', 'warning'),
('cme63jrh1008oukmoa3b3lbqm', 'New Feature Available', 'Enhanced audit logging is now available. Check out the new features in the audit module.', 1, '2025-08-10 19:48:40.789', '2025-08-10 19:48:40.789', 'cme63jp9c0000ukmoylyi6jdy', 'medium', NULL, 'superadmin', NULL, 'superadmin', NULL, NULL, '2025-08-10 19:48:40.765', 'sent', 'success');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `id` varchar(191) NOT NULL,
  `token` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `expiresAt` datetime(3) NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `superAdminId` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL DEFAULT 'superadmin'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `password_reset_tokens`
--

INSERT INTO `password_reset_tokens` (`id`, `token`, `email`, `expiresAt`, `used`, `createdAt`, `superAdminId`, `type`) VALUES
('cme67wb5d0015uk0uw8hrg80z', 'b8ebfd17cb0989df49a5e148b5806796db1088e3b40d52d0a793b828399917ba', 'admin@superadmin.com', '2025-08-10 22:05:24.064', 0, '2025-08-10 21:50:24.617', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin');

-- --------------------------------------------------------

--
-- Table structure for table `permissions`
--

CREATE TABLE `permissions` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `action` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `submodule` varchar(191) DEFAULT NULL,
  `moduleKey` varchar(191) NOT NULL,
  `category` varchar(191) DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `resource` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `permissions`
--

INSERT INTO `permissions` (`id`, `name`, `description`, `action`, `createdAt`, `updatedAt`, `isActive`, `submodule`, `moduleKey`, `category`, `isSystem`, `resource`) VALUES
('cme634fou0001ukuais092kbg', 'dashboard:view', 'View dashboard', 'view', '2025-08-10 19:36:45.678', '2025-08-10 19:36:45.678', 1, NULL, 'dashboard', NULL, 0, NULL),
('cme637ugh0001uko89nlxtib5', 'notifications:view', 'View notifications', 'view', '2025-08-10 19:39:24.785', '2025-08-10 19:39:24.785', 1, NULL, 'notifications', NULL, 0, NULL),
('cme637ugs0003uko8lglnwyai', 'users:view', 'View users', 'view', '2025-08-10 19:39:24.796', '2025-08-10 19:39:24.796', 1, NULL, 'users', NULL, 0, NULL),
('cme637ugv0005uko8mqxk9nff', 'users:create', 'Create users', 'create', '2025-08-10 19:39:24.799', '2025-08-10 19:39:24.799', 1, NULL, 'users', NULL, 0, NULL),
('cme637ugz0007uko834umywr8', 'users:edit', 'Edit users', 'edit', '2025-08-10 19:39:24.804', '2025-08-10 19:39:24.804', 1, NULL, 'users', NULL, 0, NULL),
('cme637uh20009uko8b2zyafgn', 'users:delete', 'Delete users', 'delete', '2025-08-10 19:39:24.806', '2025-08-10 19:39:24.806', 1, NULL, 'users', NULL, 0, NULL),
('cme637uh5000buko828a3gchg', 'roles:view', 'View roles', 'view', '2025-08-10 19:39:24.810', '2025-08-10 19:39:24.810', 1, NULL, 'roles', NULL, 0, NULL),
('cme637uh9000duko8z85l0jlh', 'roles:create', 'Create roles', 'create', '2025-08-10 19:39:24.814', '2025-08-10 19:39:24.814', 1, NULL, 'roles', NULL, 0, NULL),
('cme637uhd000fuko8h2ba65kw', 'roles:edit', 'Edit roles', 'edit', '2025-08-10 19:39:24.817', '2025-08-10 19:39:24.817', 1, NULL, 'roles', NULL, 0, NULL),
('cme637uhg000huko81fxnmvdk', 'roles:delete', 'Delete roles', 'delete', '2025-08-10 19:39:24.820', '2025-08-10 19:39:24.820', 1, NULL, 'roles', NULL, 0, NULL),
('cme637uhj000juko8wclmhakw', 'modules:view', 'View modules', 'view', '2025-08-10 19:39:24.823', '2025-08-10 19:39:24.823', 1, NULL, 'modules', NULL, 0, NULL),
('cme637uhm000luko8ofjg13i9', 'modules:edit', 'Edit modules', 'edit', '2025-08-10 19:39:24.826', '2025-08-10 19:39:24.826', 1, NULL, 'modules', NULL, 0, NULL),
('cme637uhp000nuko870yzx8s2', 'audit:view', 'View audit logs', 'view', '2025-08-10 19:39:24.830', '2025-08-10 19:39:24.830', 1, NULL, 'audit', NULL, 0, NULL),
('cme637uht000puko888odrcce', 'settings:view', 'View settings', 'view', '2025-08-10 19:39:24.833', '2025-08-10 19:39:24.833', 1, NULL, 'settings', NULL, 0, NULL),
('cme637uhw000ruko8k60yfbf3', 'settings:edit', 'Edit settings', 'edit', '2025-08-10 19:39:24.836', '2025-08-10 19:39:24.836', 1, NULL, 'settings', NULL, 0, NULL),
('cme637uhy000tuko817q5fwfg', 'support:view', 'View support', 'view', '2025-08-10 19:39:24.838', '2025-08-10 19:39:24.838', 1, NULL, 'support', NULL, 0, NULL),
('cme637ui1000vuko89ii0al60', 'support:create', 'Create support tickets', 'create', '2025-08-10 19:39:24.842', '2025-08-10 19:39:24.842', 1, NULL, 'support', NULL, 0, NULL),
('cme637ui5000xuko8n6jpez8t', 'support:edit', 'Edit support tickets', 'edit', '2025-08-10 19:39:24.845', '2025-08-10 19:39:24.845', 1, NULL, 'support', NULL, 0, NULL),
('cme63b20q0001ukq1dhrc0gup', 'modules.view', 'Can view the list of available modules and their current enablement status for the tenant', 'view', '2025-08-10 19:41:54.555', '2025-08-10 19:41:54.555', 1, NULL, 'modules', 'Module Management', 1, NULL),
('cme63b20v0003ukq166hfsvrw', 'modules.enable_disable', 'Can enable or disable modules for the tenant', 'enable_disable', '2025-08-10 19:41:54.560', '2025-08-10 19:41:54.560', 1, NULL, 'modules', 'Module Management', 1, NULL),
('cme63b20y0005ukq1yr8800vu', 'modules.manage_versions', 'Can update, rollback, or configure module versions', 'manage_versions', '2025-08-10 19:41:54.562', '2025-08-10 19:41:54.562', 1, NULL, 'modules', 'Module Management', 1, NULL),
('cme63b2100007ukq1kfiw7soc', 'modules.view_analytics', 'Can view usage reports and analytics related to modules', 'view_analytics', '2025-08-10 19:41:54.565', '2025-08-10 19:41:54.565', 1, NULL, 'modules', 'Module Management', 1, NULL),
('cme645htd0002ukywm2xffrmt', 'view_notifications', 'View notifications list and details', 'view', '2025-08-10 20:05:34.704', '2025-08-10 20:05:34.704', 1, NULL, 'notifications', 'notifications', 1, 'notifications'),
('cme645hts0004ukyw14412rdv', 'create_notifications', 'Create new notifications', 'create', '2025-08-10 20:05:34.720', '2025-08-10 20:05:34.720', 1, NULL, 'notifications', 'notifications', 1, 'notifications'),
('cme645htv0006ukyww4vo0hu5', 'edit_notifications', 'Edit existing notifications', 'edit', '2025-08-10 20:05:34.724', '2025-08-10 20:05:34.724', 1, NULL, 'notifications', 'notifications', 1, 'notifications'),
('cme645htz0008ukywtvk2pb9e', 'delete_notifications', 'Delete notifications', 'delete', '2025-08-10 20:05:34.727', '2025-08-10 20:05:34.727', 1, NULL, 'notifications', 'notifications', 1, 'notifications'),
('cme645hu2000aukywti1d2fa9', 'send_notifications', 'Send notifications to target audience', 'send', '2025-08-10 20:05:34.730', '2025-08-10 20:05:34.730', 1, NULL, 'notifications', 'notifications', 1, 'notifications');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` varchar(191) NOT NULL,
  `tokenId` varchar(191) NOT NULL,
  `hashedToken` varchar(191) NOT NULL,
  `superAdminId` varchar(191) NOT NULL,
  `isRevoked` tinyint(1) NOT NULL DEFAULT 0,
  `expiresAt` datetime(3) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `lastUsedAt` datetime(3) DEFAULT NULL,
  `deviceInfo` varchar(191) DEFAULT NULL,
  `ipAddress` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reports`
--

CREATE TABLE `reports` (
  `id` varchar(191) NOT NULL,
  `tenantId` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `data` longtext NOT NULL,
  `name` varchar(191) NOT NULL,
  `superAdminId` varchar(191) DEFAULT NULL,
  `type` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `isDefault` tinyint(1) NOT NULL DEFAULT 0,
  `isTemplate` tinyint(1) NOT NULL DEFAULT 0,
  `tenantId` varchar(191) DEFAULT NULL,
  `color` varchar(191) DEFAULT NULL,
  `createdBy` varchar(191) DEFAULT NULL,
  `isSystem` tinyint(1) NOT NULL DEFAULT 0,
  `priority` int(11) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id`, `name`, `description`, `isActive`, `createdAt`, `updatedAt`, `isDefault`, `isTemplate`, `tenantId`, `color`, `createdBy`, `isSystem`, `priority`) VALUES
('cme63jpbx0028ukmocdzy9eif', 'Admin', 'Full administrative access', 1, '2025-08-10 19:48:38.013', '2025-08-10 19:48:38.013', 0, 0, 'cme63jpac0001ukmof66twwc2', '#dc2626', NULL, 1, 1),
('cme63jpbz002aukmo4kl82etd', 'Manager', 'Management level access', 1, '2025-08-10 19:48:38.016', '2025-08-10 19:48:38.016', 0, 0, 'cme63jpac0001ukmof66twwc2', '#ea580c', NULL, 1, 2),
('cme63jpc0002cukmoxuhmjxli', 'User', 'Standard user access', 1, '2025-08-10 19:48:38.017', '2025-08-10 19:48:38.017', 1, 0, 'cme63jpac0001ukmof66twwc2', '#2563eb', NULL, 1, 3),
('cme63jpc1002eukmo8xpzrfzs', 'Viewer', 'Read-only access', 1, '2025-08-10 19:48:38.017', '2025-08-10 19:48:38.017', 0, 0, 'cme63jpac0001ukmof66twwc2', '#059669', NULL, 1, 4),
('cme63jpc3002gukmob0xii7k7', 'Admin', 'Full administrative access', 1, '2025-08-10 19:48:38.019', '2025-08-10 19:48:38.019', 0, 0, 'cme63jpac0002ukmonmpz2che', '#dc2626', NULL, 1, 1),
('cme63jpc7002iukmouc7b00as', 'Manager', 'Management level access', 1, '2025-08-10 19:48:38.023', '2025-08-10 19:48:38.023', 0, 0, 'cme63jpac0002ukmonmpz2che', '#ea580c', NULL, 1, 2),
('cme63jpc8002kukmon1modust', 'User', 'Standard user access', 1, '2025-08-10 19:48:38.024', '2025-08-10 19:48:38.024', 1, 0, 'cme63jpac0002ukmonmpz2che', '#2563eb', NULL, 1, 3),
('cme63jpc9002mukmonixcj0id', 'Viewer', 'Read-only access', 1, '2025-08-10 19:48:38.025', '2025-08-10 19:48:38.025', 0, 0, 'cme63jpac0002ukmonmpz2che', '#059669', NULL, 1, 4);

-- --------------------------------------------------------

--
-- Table structure for table `role_permissions`
--

CREATE TABLE `role_permissions` (
  `id` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `permissionId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_permissions`
--

INSERT INTO `role_permissions` (`id`, `roleId`, `permissionId`) VALUES
('cme63jpcc002oukmo7l2s954x', 'cme63jpbx0028ukmocdzy9eif', 'cme634fou0001ukuais092kbg'),
('cme63jpce002qukmo6q1wb3k3', 'cme63jpbx0028ukmocdzy9eif', 'cme637ugh0001uko89nlxtib5'),
('cme63jpcf002sukmoq6kqd1hh', 'cme63jpbx0028ukmocdzy9eif', 'cme637ugs0003uko8lglnwyai'),
('cme63jpcg002uukmocxjo0bbb', 'cme63jpbx0028ukmocdzy9eif', 'cme637ugv0005uko8mqxk9nff'),
('cme63jpch002wukmoh0bspc3b', 'cme63jpbx0028ukmocdzy9eif', 'cme637ugz0007uko834umywr8'),
('cme63jpci002yukmo7l74gw4j', 'cme63jpbx0028ukmocdzy9eif', 'cme637uh20009uko8b2zyafgn'),
('cme63jpck0030ukmokfyn7an5', 'cme63jpbx0028ukmocdzy9eif', 'cme637uh5000buko828a3gchg'),
('cme63jpcl0032ukmofz72vy4d', 'cme63jpbx0028ukmocdzy9eif', 'cme637uh9000duko8z85l0jlh'),
('cme63jpcm0034ukmolmmrtsho', 'cme63jpbx0028ukmocdzy9eif', 'cme637uhd000fuko8h2ba65kw'),
('cme63jpcn0036ukmobav6cgtu', 'cme63jpbx0028ukmocdzy9eif', 'cme637uhg000huko81fxnmvdk'),
('cme63jpco0038ukmovmp9ix6p', 'cme63jpbx0028ukmocdzy9eif', 'cme637uhj000juko8wclmhakw'),
('cme63jpcp003aukmorteyqnb9', 'cme63jpbx0028ukmocdzy9eif', 'cme637uhm000luko8ofjg13i9'),
('cme63jpcq003cukmo57c7uyz0', 'cme63jpbx0028ukmocdzy9eif', 'cme637uhp000nuko870yzx8s2'),
('cme63jpcr003eukmow4dfpgwx', 'cme63jpbx0028ukmocdzy9eif', 'cme637uht000puko888odrcce'),
('cme63jpcr003gukmotzxf5029', 'cme63jpbx0028ukmocdzy9eif', 'cme637uhw000ruko8k60yfbf3'),
('cme63jpcs003iukmowac0wblf', 'cme63jpbx0028ukmocdzy9eif', 'cme637uhy000tuko817q5fwfg'),
('cme63jpct003kukmoy9vi2rb5', 'cme63jpbx0028ukmocdzy9eif', 'cme637ui1000vuko89ii0al60'),
('cme63jpcu003mukmoktwixql8', 'cme63jpbx0028ukmocdzy9eif', 'cme637ui5000xuko8n6jpez8t'),
('cme63jpcu003oukmo2lls9ndg', 'cme63jpbz002aukmo4kl82etd', 'cme634fou0001ukuais092kbg'),
('cme63jpcv003qukmob0ihzfld', 'cme63jpbz002aukmo4kl82etd', 'cme637ugh0001uko89nlxtib5'),
('cme63jpcw003sukmobje02qq7', 'cme63jpbz002aukmo4kl82etd', 'cme637ugs0003uko8lglnwyai'),
('cme63jpcx003uukmoy5wlfd9g', 'cme63jpbz002aukmo4kl82etd', 'cme637ugv0005uko8mqxk9nff'),
('cme63jpcx003wukmo928tjxi4', 'cme63jpbz002aukmo4kl82etd', 'cme637ugz0007uko834umywr8'),
('cme63jpcy003yukmomcz2s6fn', 'cme63jpbz002aukmo4kl82etd', 'cme637uh5000buko828a3gchg'),
('cme63jpcz0040ukmo3g6nuxyc', 'cme63jpbz002aukmo4kl82etd', 'cme637uhj000juko8wclmhakw'),
('cme63jpd00042ukmoo3wwtbam', 'cme63jpbz002aukmo4kl82etd', 'cme637uhp000nuko870yzx8s2'),
('cme63jpd10044ukmovo6jqtez', 'cme63jpbz002aukmo4kl82etd', 'cme637uht000puko888odrcce'),
('cme63jpd20046ukmodduvmqe7', 'cme63jpbz002aukmo4kl82etd', 'cme637uhy000tuko817q5fwfg'),
('cme63jpd30048ukmoq080mhkj', 'cme63jpbz002aukmo4kl82etd', 'cme637ui1000vuko89ii0al60'),
('cme63jpd4004aukmoiuw1k5w1', 'cme63jpbz002aukmo4kl82etd', 'cme637ui5000xuko8n6jpez8t'),
('cme63jpd5004cukmoew1m1wrk', 'cme63jpc0002cukmoxuhmjxli', 'cme634fou0001ukuais092kbg'),
('cme63jpd6004eukmo4iyol4bp', 'cme63jpc0002cukmoxuhmjxli', 'cme637ugh0001uko89nlxtib5'),
('cme63jpd6004gukmosd3jf6i5', 'cme63jpc0002cukmoxuhmjxli', 'cme637uhy000tuko817q5fwfg'),
('cme63jpd7004iukmoo16r6azo', 'cme63jpc0002cukmoxuhmjxli', 'cme637ui1000vuko89ii0al60'),
('cme63jpd8004kukmopmnf4zmo', 'cme63jpc1002eukmo8xpzrfzs', 'cme634fou0001ukuais092kbg'),
('cme63jpd9004mukmoxk689toe', 'cme63jpc1002eukmo8xpzrfzs', 'cme637ugh0001uko89nlxtib5'),
('cme63jpd9004oukmoqcnxkkxp', 'cme63jpc1002eukmo8xpzrfzs', 'cme637uhy000tuko817q5fwfg'),
('cme63jpda004qukmodwi4jvj6', 'cme63jpc3002gukmob0xii7k7', 'cme634fou0001ukuais092kbg'),
('cme63jpdb004sukmohouiah0a', 'cme63jpc3002gukmob0xii7k7', 'cme637ugh0001uko89nlxtib5'),
('cme63jpdb004uukmooy7n4k53', 'cme63jpc3002gukmob0xii7k7', 'cme637ugs0003uko8lglnwyai'),
('cme63jpdc004wukmo14dpbpmy', 'cme63jpc3002gukmob0xii7k7', 'cme637ugv0005uko8mqxk9nff'),
('cme63jpdd004yukmoeguyrfk1', 'cme63jpc3002gukmob0xii7k7', 'cme637ugz0007uko834umywr8'),
('cme63jpdd0050ukmoyzvm4w2f', 'cme63jpc3002gukmob0xii7k7', 'cme637uh20009uko8b2zyafgn'),
('cme63jpde0052ukmoe699wv6p', 'cme63jpc3002gukmob0xii7k7', 'cme637uh5000buko828a3gchg'),
('cme63jpdf0054ukmoe3tmxwqm', 'cme63jpc3002gukmob0xii7k7', 'cme637uh9000duko8z85l0jlh'),
('cme63jpdg0056ukmoha47r73z', 'cme63jpc3002gukmob0xii7k7', 'cme637uhd000fuko8h2ba65kw'),
('cme63jpdg0058ukmo7n7avkps', 'cme63jpc3002gukmob0xii7k7', 'cme637uhg000huko81fxnmvdk'),
('cme63jpdi005aukmowonqpjo5', 'cme63jpc3002gukmob0xii7k7', 'cme637uhj000juko8wclmhakw'),
('cme63jpdl005cukmoep4b00iq', 'cme63jpc3002gukmob0xii7k7', 'cme637uhm000luko8ofjg13i9'),
('cme63jpdn005eukmo1k1z212m', 'cme63jpc3002gukmob0xii7k7', 'cme637uhp000nuko870yzx8s2'),
('cme63jpds005gukmotze8vifh', 'cme63jpc3002gukmob0xii7k7', 'cme637uht000puko888odrcce'),
('cme63jpdu005iukmow8vqjm9h', 'cme63jpc3002gukmob0xii7k7', 'cme637uhw000ruko8k60yfbf3'),
('cme63jpdv005kukmo2zvscj73', 'cme63jpc3002gukmob0xii7k7', 'cme637uhy000tuko817q5fwfg'),
('cme63jpdy005mukmowkplxpjs', 'cme63jpc3002gukmob0xii7k7', 'cme637ui1000vuko89ii0al60'),
('cme63jpe7005oukmo0sei92nu', 'cme63jpc3002gukmob0xii7k7', 'cme637ui5000xuko8n6jpez8t'),
('cme63jpeb005qukmo0sz43zru', 'cme63jpc7002iukmouc7b00as', 'cme634fou0001ukuais092kbg'),
('cme63jpei005sukmo4i4f62lg', 'cme63jpc7002iukmouc7b00as', 'cme637ugh0001uko89nlxtib5'),
('cme63jper005uukmoh0heo188', 'cme63jpc7002iukmouc7b00as', 'cme637ugs0003uko8lglnwyai'),
('cme63jpf5005wukmomelgkbfn', 'cme63jpc7002iukmouc7b00as', 'cme637ugv0005uko8mqxk9nff'),
('cme63jpff005yukmol698cg8c', 'cme63jpc7002iukmouc7b00as', 'cme637ugz0007uko834umywr8'),
('cme63jpfk0060ukmo6oqt6z68', 'cme63jpc7002iukmouc7b00as', 'cme637uh5000buko828a3gchg'),
('cme63jpfp0062ukmoxslexiox', 'cme63jpc7002iukmouc7b00as', 'cme637uhj000juko8wclmhakw'),
('cme63jpfw0064ukmoqqsmrmou', 'cme63jpc7002iukmouc7b00as', 'cme637uhp000nuko870yzx8s2'),
('cme63jpg10066ukmoptecnqz9', 'cme63jpc7002iukmouc7b00as', 'cme637uht000puko888odrcce'),
('cme63jpgb0068ukmozyuysrt3', 'cme63jpc7002iukmouc7b00as', 'cme637uhy000tuko817q5fwfg'),
('cme63jpgf006aukmo448471xw', 'cme63jpc7002iukmouc7b00as', 'cme637ui1000vuko89ii0al60'),
('cme63jpgj006cukmo6uz7n333', 'cme63jpc7002iukmouc7b00as', 'cme637ui5000xuko8n6jpez8t'),
('cme63jpgq006eukmoyifgqjgl', 'cme63jpc8002kukmon1modust', 'cme634fou0001ukuais092kbg'),
('cme63jpgv006gukmowvajng1p', 'cme63jpc8002kukmon1modust', 'cme637ugh0001uko89nlxtib5'),
('cme63jph1006iukmoyrtb9yyz', 'cme63jpc8002kukmon1modust', 'cme637uhy000tuko817q5fwfg'),
('cme63jph9006kukmoeb1ugndt', 'cme63jpc8002kukmon1modust', 'cme637ui1000vuko89ii0al60'),
('cme63jphi006mukmobhtcpb45', 'cme63jpc9002mukmonixcj0id', 'cme634fou0001ukuais092kbg'),
('cme63jphs006oukmo363m4hqc', 'cme63jpc9002mukmonixcj0id', 'cme637ugh0001uko89nlxtib5'),
('cme63jphx006qukmopi25fp5t', 'cme63jpc9002mukmonixcj0id', 'cme637uhy000tuko817q5fwfg');

-- --------------------------------------------------------

--
-- Table structure for table `super_admins`
--

CREATE TABLE `super_admins` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `contactNumber` varchar(191) DEFAULT NULL,
  `avatar` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `super_admins`
--

INSERT INTO `super_admins` (`id`, `email`, `name`, `password`, `isActive`, `createdAt`, `updatedAt`, `contactNumber`, `avatar`) VALUES
('cme63jp9c0000ukmoylyi6jdy', 'admin@superadmin.com', 'Super Administrator', '$2b$12$7Evns60yq76zTBixC2tpiu/ifSwdyC9ehBSdebkLnweo/nayj8C0G', 1, '2025-08-10 19:48:37.919', '2025-08-10 19:48:37.919', '+1-555-0123', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` varchar(191) NOT NULL,
  `description` text NOT NULL,
  `status` varchar(191) NOT NULL DEFAULT 'open',
  `priority` varchar(191) NOT NULL DEFAULT 'medium',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `tenantId` varchar(191) DEFAULT NULL,
  `userId` varchar(191) DEFAULT NULL,
  `category` varchar(191) NOT NULL DEFAULT 'general',
  `isForwarded` tinyint(1) NOT NULL DEFAULT 0,
  `title` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `support_tickets`
--

INSERT INTO `support_tickets` (`id`, `description`, `status`, `priority`, `createdAt`, `updatedAt`, `tenantId`, `userId`, `category`, `isForwarded`, `title`) VALUES
('cme63jrh70096ukmokhvxtnsv', 'Users are experiencing intermittent login problems. Need assistance.', 'open', 'high', '2025-08-10 19:48:40.795', '2025-08-10 19:48:40.795', 'cme63jpac0001ukmof66twwc2', 'cme63jqir0074ukmoke8ownfr', 'technical', 0, 'Login Issues'),
('cme63jrhb009cukmo0gpnzaue', 'Request for additional reporting capabilities in the dashboard.', 'in_progress', 'medium', '2025-08-10 19:48:40.800', '2025-08-10 19:48:40.800', 'cme63jpac0001ukmof66twwc2', 'cme63jq1r006wukmo7rr1nmi7', 'feature', 0, 'Feature Request'),
('cme63jrhk009iukmopcq745la', 'Need help setting up new user accounts with proper permissions.', 'resolved', 'low', '2025-08-10 19:48:40.808', '2025-08-10 19:48:40.808', 'cme63jpac0002ukmonmpz2che', 'cme63jrg9007kukmow1k7dnk2', 'account', 0, 'User Account Setup'),
('cme63jrht009oukmovo7vol57', 'Dashboard is loading slowly. Performance optimization needed.', 'open', 'high', '2025-08-10 19:48:40.818', '2025-08-10 19:48:40.818', 'cme63jpac0001ukmof66twwc2', 'cme63jpsv006sukmorpt3aim6', 'technical', 0, 'Performance Issues');

-- --------------------------------------------------------

--
-- Table structure for table `support_ticket_attachments`
--

CREATE TABLE `support_ticket_attachments` (
  `id` varchar(191) NOT NULL,
  `filename` varchar(191) NOT NULL,
  `originalName` varchar(191) NOT NULL,
  `mimeType` varchar(191) NOT NULL,
  `size` int(11) NOT NULL,
  `path` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `ticketId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_ticket_comments`
--

CREATE TABLE `support_ticket_comments` (
  `id` varchar(191) NOT NULL,
  `text` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `ticketId` varchar(191) NOT NULL,
  `commentedBy` varchar(191) NOT NULL,
  `commenterType` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `support_ticket_comments`
--

INSERT INTO `support_ticket_comments` (`id`, `text`, `createdAt`, `updatedAt`, `ticketId`, `commentedBy`, `commenterType`) VALUES
('cme63jrha0098ukmowwm885db', 'Thank you for reporting this issue. We are investigating.', '2025-08-10 19:48:40.798', '2025-08-10 19:48:40.798', 'cme63jrh70096ukmokhvxtnsv', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin'),
('cme63jrhb009aukmoohyk52ma', 'This has been escalated to our technical team.', '2025-08-10 19:48:40.799', '2025-08-10 19:48:40.799', 'cme63jrh70096ukmokhvxtnsv', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin'),
('cme63jrhd009eukmo13x9u8on', 'Thank you for reporting this issue. We are investigating.', '2025-08-10 19:48:40.801', '2025-08-10 19:48:40.801', 'cme63jrhb009cukmo0gpnzaue', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin'),
('cme63jrhg009gukmonhfn5ti1', 'This has been escalated to our technical team.', '2025-08-10 19:48:40.805', '2025-08-10 19:48:40.805', 'cme63jrhb009cukmo0gpnzaue', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin'),
('cme63jrhm009kukmouhscxb60', 'Thank you for reporting this issue. We are investigating.', '2025-08-10 19:48:40.811', '2025-08-10 19:48:40.811', 'cme63jrhk009iukmopcq745la', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin'),
('cme63jrhq009mukmokxsd5gpj', 'This has been escalated to our technical team.', '2025-08-10 19:48:40.815', '2025-08-10 19:48:40.815', 'cme63jrhk009iukmopcq745la', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin'),
('cme63jrhw009qukmo9scfa3gr', 'Thank you for reporting this issue. We are investigating.', '2025-08-10 19:48:40.820', '2025-08-10 19:48:40.820', 'cme63jrht009oukmovo7vol57', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin'),
('cme63jrhz009sukmolv6po0jh', 'This has been escalated to our technical team.', '2025-08-10 19:48:40.823', '2025-08-10 19:48:40.823', 'cme63jrht009oukmovo7vol57', 'cme63jp9c0000ukmoylyi6jdy', 'superadmin');

-- --------------------------------------------------------

--
-- Table structure for table `support_ticket_comment_attachments`
--

CREATE TABLE `support_ticket_comment_attachments` (
  `id` varchar(191) NOT NULL,
  `filename` varchar(191) NOT NULL,
  `originalName` varchar(191) NOT NULL,
  `mimeType` varchar(191) NOT NULL,
  `size` int(11) NOT NULL,
  `path` varchar(191) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `commentId` varchar(191) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_logs`
--

CREATE TABLE `system_logs` (
  `id` varchar(191) NOT NULL,
  `level` varchar(191) NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `system_settings`
--

CREATE TABLE `system_settings` (
  `id` varchar(191) NOT NULL,
  `key` varchar(191) NOT NULL,
  `value` text NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `system_settings`
--

INSERT INTO `system_settings` (`id`, `key`, `value`, `createdAt`, `updatedAt`) VALUES
('cme63jrjm00clukmoxymqzd5o', 'maintenance_mode', 'false', '2025-08-10 19:48:40.882', '2025-08-10 19:48:40.882'),
('cme63jrjo00cmukmovyt4sh7q', 'max_users_per_tenant', '1000', '2025-08-10 19:48:40.885', '2025-08-10 19:48:40.885'),
('cme63jrjq00cnukmol4v8wp1v', 'session_timeout_minutes', '30', '2025-08-10 19:48:40.886', '2025-08-10 19:48:40.886'),
('cme63jrjr00coukmolzaeatc2', 'password_policy_min_length', '8', '2025-08-10 19:48:40.888', '2025-08-10 19:48:40.888'),
('cme63jrjs00cpukmoy5y7lu1u', 'enable_audit_logging', 'true', '2025-08-10 19:48:40.889', '2025-08-10 19:48:40.889'),
('cme63jrjt00cqukmon75h26rb', 'default_tenant_plan', 'starter', '2025-08-10 19:48:40.890', '2025-08-10 19:48:40.890');

-- --------------------------------------------------------

--
-- Table structure for table `tenants`
--

CREATE TABLE `tenants` (
  `id` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `slug` varchar(191) NOT NULL,
  `domain` varchar(191) DEFAULT NULL,
  `description` varchar(191) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `plan` varchar(191) NOT NULL DEFAULT 'starter',
  `region` varchar(191) NOT NULL DEFAULT 'US East',
  `features` longtext NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `metadata` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenants`
--

INSERT INTO `tenants` (`id`, `name`, `slug`, `domain`, `description`, `isActive`, `plan`, `region`, `features`, `createdAt`, `updatedAt`, `metadata`) VALUES
('cme63jpac0001ukmof66twwc2', 'TechCorp Solutions', 'techcorp', 'techcorp.com', 'Leading technology solutions provider', 1, 'enterprise', 'US East', '[\"dashboard\",\"users\",\"roles\",\"modules\",\"audit\",\"support\",\"notifications\",\"settings\"]', '2025-08-10 19:48:37.956', '2025-08-10 19:48:37.956', '{\"industry\":\"Technology\",\"size\":\"500+ employees\"}'),
('cme63jpac0002ukmonmpz2che', 'Global Retail Inc', 'globalretail', 'globalretail.com', 'International retail chain', 1, 'professional', 'US West', '[\"dashboard\",\"users\",\"roles\",\"modules\",\"audit\",\"support\",\"notifications\",\"settings\"]', '2025-08-10 19:48:37.956', '2025-08-10 19:48:37.956', '{\"industry\":\"Retail\",\"size\":\"1000+ employees\"}');

-- --------------------------------------------------------

--
-- Table structure for table `tenant_modules`
--

CREATE TABLE `tenant_modules` (
  `id` varchar(191) NOT NULL,
  `tenantId` varchar(191) NOT NULL,
  `moduleKey` varchar(191) NOT NULL,
  `isEnabled` tinyint(1) NOT NULL DEFAULT 1,
  `isVisible` tinyint(1) NOT NULL DEFAULT 1,
  `version` varchar(191) DEFAULT NULL,
  `settings` longtext DEFAULT NULL,
  `enabledAt` datetime(3) DEFAULT NULL,
  `disabledAt` datetime(3) DEFAULT NULL,
  `enabledBy` varchar(191) DEFAULT NULL,
  `disabledBy` varchar(191) DEFAULT NULL,
  `lastAccessedAt` datetime(3) DEFAULT NULL,
  `accessCount` int(11) NOT NULL DEFAULT 0,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `tenant_modules`
--

INSERT INTO `tenant_modules` (`id`, `tenantId`, `moduleKey`, `isEnabled`, `isVisible`, `version`, `settings`, `enabledAt`, `disabledAt`, `enabledBy`, `disabledBy`, `lastAccessedAt`, `accessCount`, `createdAt`, `updatedAt`) VALUES
('cme63jpbb001cukmo3mannx3b', 'cme63jpac0001ukmof66twwc2', 'dashboard', 1, 1, NULL, NULL, '2025-08-10 19:48:37.981', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:37.991', '2025-08-10 19:48:37.991'),
('cme63jpbf001eukmof98v44ym', 'cme63jpac0001ukmof66twwc2', 'users', 1, 1, NULL, NULL, '2025-08-10 19:48:37.995', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:37.995', '2025-08-10 19:48:37.995'),
('cme63jpbh001gukmotzq81icz', 'cme63jpac0001ukmof66twwc2', 'roles', 1, 1, NULL, NULL, '2025-08-10 19:48:37.997', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:37.998', '2025-08-10 19:48:37.998'),
('cme63jpbi001iukmoy5ts6ksz', 'cme63jpac0001ukmof66twwc2', 'modules', 1, 1, NULL, NULL, '2025-08-10 19:48:37.998', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:37.999', '2025-08-10 19:48:37.999'),
('cme63jpbj001kukmoalcpa8c8', 'cme63jpac0001ukmof66twwc2', 'audit', 1, 1, NULL, NULL, '2025-08-10 19:48:37.999', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.000', '2025-08-10 19:48:38.000'),
('cme63jpbk001mukmo69j8cg8q', 'cme63jpac0001ukmof66twwc2', 'support', 1, 1, NULL, NULL, '2025-08-10 19:48:38.000', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.001', '2025-08-10 19:48:38.001'),
('cme63jpbl001oukmo6mvk3cb0', 'cme63jpac0001ukmof66twwc2', 'notifications', 1, 1, NULL, NULL, '2025-08-10 19:48:38.001', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.002', '2025-08-10 19:48:38.002'),
('cme63jpbm001qukmokwomwmpd', 'cme63jpac0001ukmof66twwc2', 'settings', 1, 1, NULL, NULL, '2025-08-10 19:48:38.002', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.003', '2025-08-10 19:48:38.003'),
('cme63jpbp001sukmolchz9653', 'cme63jpac0002ukmonmpz2che', 'dashboard', 1, 1, NULL, NULL, '2025-08-10 19:48:38.004', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.005', '2025-08-10 19:48:38.005'),
('cme63jpbq001uukmo3z4gpx9d', 'cme63jpac0002ukmonmpz2che', 'users', 1, 1, NULL, NULL, '2025-08-10 19:48:38.005', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.006', '2025-08-10 19:48:38.006'),
('cme63jpbr001wukmoj6epjh2j', 'cme63jpac0002ukmonmpz2che', 'roles', 1, 1, NULL, NULL, '2025-08-10 19:48:38.007', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.007', '2025-08-10 19:48:38.007'),
('cme63jpbs001yukmovwbcdurg', 'cme63jpac0002ukmonmpz2che', 'modules', 1, 1, NULL, NULL, '2025-08-10 19:48:38.008', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.009', '2025-08-10 19:48:38.009'),
('cme63jpbt0020ukmoraakqppm', 'cme63jpac0002ukmonmpz2che', 'audit', 1, 1, NULL, NULL, '2025-08-10 19:48:38.009', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.009', '2025-08-10 19:48:38.009'),
('cme63jpbu0022ukmohllma40t', 'cme63jpac0002ukmonmpz2che', 'support', 1, 1, NULL, NULL, '2025-08-10 19:48:38.010', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.010', '2025-08-10 19:48:38.010'),
('cme63jpbv0024ukmo42l6z45h', 'cme63jpac0002ukmonmpz2che', 'notifications', 1, 1, NULL, NULL, '2025-08-10 19:48:38.011', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.011', '2025-08-10 19:48:38.011'),
('cme63jpbw0026ukmo3o33uxty', 'cme63jpac0002ukmonmpz2che', 'settings', 1, 1, NULL, NULL, '2025-08-10 19:48:38.012', NULL, 'cme63jp9c0000ukmoylyi6jdy', NULL, NULL, 0, '2025-08-10 19:48:38.012', '2025-08-10 19:48:38.012');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(191) NOT NULL,
  `email` varchar(191) NOT NULL,
  `name` varchar(191) NOT NULL,
  `password` varchar(191) NOT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `lastLogin` datetime(3) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `tenantId` varchar(191) DEFAULT NULL,
  `contactNumber` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `name`, `password`, `isActive`, `lastLogin`, `createdAt`, `updatedAt`, `tenantId`, `contactNumber`) VALUES
('cme63jpsv006sukmorpt3aim6', 'admin@techcorp.com', 'Admin User (TechCorp Solutions)', '$2b$12$73yFWY8fONnRXBMCJrS/quvj/BGcHCQuIJYp/QA/kyGtMSxgS5kVS', 1, '2025-08-11 05:12:02.631', '2025-08-10 19:48:38.624', '2025-08-11 05:12:02.638', 'cme63jpac0001ukmof66twwc2', '+1-555-5335'),
('cme63jq1r006wukmo7rr1nmi7', 'manager@techcorp.com', 'Manager User (TechCorp Solutions)', '$2b$12$l2bdWdurxie2GSKHJh1JTeSobZKpfWJXHiHfLUaZiBo6spVTNczsa', 1, '2025-08-10 22:57:21.292', '2025-08-10 19:48:38.943', '2025-08-10 22:57:21.293', 'cme63jpac0001ukmof66twwc2', '+1-555-2372'),
('cme63jqaj0070ukmowmdjlsxl', 'user@techcorp.com', 'Standard User (TechCorp Solutions)', '$2b$12$ZHZfRjHRUrUVcgSNA/jaBuRu5oZXgdwIRhTU8PPemE6mJ0nbMeBfe', 1, '2025-08-10 22:58:21.246', '2025-08-10 19:48:39.259', '2025-08-10 22:58:21.246', 'cme63jpac0001ukmof66twwc2', '+1-555-6381'),
('cme63jqir0074ukmoke8ownfr', 'viewer@techcorp.com', 'Viewer User (TechCorp Solutions)', '$2b$12$vBmKjc75PaujLAGP9blaZeDx/SEFitCBA1AfytOXQtamcXLby3KgK', 1, '2025-08-10 22:59:06.704', '2025-08-10 19:48:39.555', '2025-08-10 22:59:06.705', 'cme63jpac0001ukmof66twwc2', '+1-555-8991'),
('cme63jqr00078ukmo0su3pk9p', 'admin@globalretail.com', 'Admin User (Global Retail Inc)', '$2b$12$32sf/xes9m//64/UskJiQ.Bn.IbBKsCd3c5BXmKJE52Z9NL4WvLq6', 1, '2025-08-10 22:10:12.759', '2025-08-10 19:48:39.852', '2025-08-10 22:10:12.759', 'cme63jpac0002ukmonmpz2che', '+1-555-2373'),
('cme63jqzi007cukmo2hdzxk7k', 'manager@globalretail.com', 'Manager User (Global Retail Inc)', '$2b$12$BNlgt0VSouiHLWDDkzpBc.sUnigzraCM6kcj3CqOj761VDkRCba4u', 1, '2025-08-10 22:10:51.880', '2025-08-10 19:48:40.158', '2025-08-10 22:10:51.881', 'cme63jpac0002ukmonmpz2che', '+1-555-8978'),
('cme63jr7x007gukmomcn4sqql', 'user@globalretail.com', 'Standard User (Global Retail Inc)', '$2b$12$DSwyOwKshHuLERcZ7qI/Cui7HAJeSb9e2r6eglWRAnOkW8YU4luYm', 1, '2025-08-10 22:11:28.793', '2025-08-10 19:48:40.462', '2025-08-10 22:11:28.794', 'cme63jpac0002ukmonmpz2che', '+1-555-9362'),
('cme63jrg9007kukmow1k7dnk2', 'viewer@globalretail.com', 'Viewer User (Global Retail Inc)', '$2b$12$WuhotoR9xA938M5tOKhePuuFSw2TDCX16/kKFSWDv9ateb1oIozaK', 1, '2025-08-10 22:12:06.513', '2025-08-10 19:48:40.762', '2025-08-10 22:12:06.513', 'cme63jpac0002ukmonmpz2che', '+1-555-6885');

-- --------------------------------------------------------

--
-- Table structure for table `user_notifications`
--

CREATE TABLE `user_notifications` (
  `id` varchar(191) NOT NULL,
  `notificationId` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `tenantId` varchar(191) DEFAULT NULL,
  `isRead` tinyint(1) NOT NULL DEFAULT 0,
  `readAt` datetime(3) DEFAULT NULL,
  `isActive` tinyint(1) NOT NULL DEFAULT 1,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_notifications`
--

INSERT INTO `user_notifications` (`id`, `notificationId`, `userId`, `tenantId`, `isRead`, `readAt`, `isActive`, `createdAt`) VALUES
('cme63jrgj007qukmorzk71667', 'cme63jrge007oukmozvbz7h37', 'cme63jpsv006sukmorpt3aim6', 'cme63jpac0001ukmof66twwc2', 1, NULL, 1, '2025-08-10 19:48:40.772'),
('cme63jrgm007sukmoyazw41qp', 'cme63jrge007oukmozvbz7h37', 'cme63jq1r006wukmo7rr1nmi7', 'cme63jpac0001ukmof66twwc2', 1, '2025-08-10 19:48:40.774', 1, '2025-08-10 19:48:40.775'),
('cme63jrgo007uukmovpmrq9fj', 'cme63jrge007oukmozvbz7h37', 'cme63jqaj0070ukmowmdjlsxl', 'cme63jpac0001ukmof66twwc2', 1, '2025-08-10 19:48:40.775', 1, '2025-08-10 19:48:40.776'),
('cme63jrgq007wukmo1w8riagw', 'cme63jrge007oukmozvbz7h37', 'cme63jqir0074ukmoke8ownfr', 'cme63jpac0001ukmof66twwc2', 0, '2025-08-10 19:48:40.777', 1, '2025-08-10 19:48:40.778'),
('cme63jrgq007yukmoovw6ezzx', 'cme63jrge007oukmozvbz7h37', 'cme63jqr00078ukmo0su3pk9p', 'cme63jpac0002ukmonmpz2che', 1, NULL, 1, '2025-08-10 19:48:40.779'),
('cme63jrgr0080ukmoxs6qlamu', 'cme63jrge007oukmozvbz7h37', 'cme63jqzi007cukmo2hdzxk7k', 'cme63jpac0002ukmonmpz2che', 0, '2025-08-10 19:48:40.779', 1, '2025-08-10 19:48:40.780'),
('cme63jrgs0082ukmodbjb0wb7', 'cme63jrge007oukmozvbz7h37', 'cme63jr7x007gukmomcn4sqql', 'cme63jpac0002ukmonmpz2che', 1, '2025-08-10 19:48:40.780', 1, '2025-08-10 19:48:40.780'),
('cme63jrgt0084ukmo3l112xl0', 'cme63jrge007oukmozvbz7h37', 'cme63jrg9007kukmow1k7dnk2', 'cme63jpac0002ukmonmpz2che', 0, NULL, 1, '2025-08-10 19:48:40.781'),
('cme63jrgu0088ukmoja0i5o09', 'cme63jrgu0086ukmobzipvzdr', 'cme63jpsv006sukmorpt3aim6', 'cme63jpac0001ukmof66twwc2', 1, NULL, 1, '2025-08-10 19:48:40.783'),
('cme63jrgv008aukmoak79vx5z', 'cme63jrgu0086ukmobzipvzdr', 'cme63jq1r006wukmo7rr1nmi7', 'cme63jpac0001ukmof66twwc2', 0, NULL, 1, '2025-08-10 19:48:40.784'),
('cme63jrgw008cukmoqvuhp1xk', 'cme63jrgu0086ukmobzipvzdr', 'cme63jqaj0070ukmowmdjlsxl', 'cme63jpac0001ukmof66twwc2', 1, '2025-08-10 19:48:40.784', 1, '2025-08-10 19:48:40.784'),
('cme63jrgx008eukmo9hb0clet', 'cme63jrgu0086ukmobzipvzdr', 'cme63jqir0074ukmoke8ownfr', 'cme63jpac0001ukmof66twwc2', 1, NULL, 1, '2025-08-10 19:48:40.785'),
('cme63jrgx008gukmo7zlhwwwi', 'cme63jrgu0086ukmobzipvzdr', 'cme63jqr00078ukmo0su3pk9p', 'cme63jpac0002ukmonmpz2che', 1, '2025-08-10 19:48:40.785', 1, '2025-08-10 19:48:40.786'),
('cme63jrgy008iukmopbrs2s8p', 'cme63jrgu0086ukmobzipvzdr', 'cme63jqzi007cukmo2hdzxk7k', 'cme63jpac0002ukmonmpz2che', 1, '2025-08-10 19:48:40.786', 1, '2025-08-10 19:48:40.787'),
('cme63jrgz008kukmo08pwsxvs', 'cme63jrgu0086ukmobzipvzdr', 'cme63jr7x007gukmomcn4sqql', 'cme63jpac0002ukmonmpz2che', 1, NULL, 1, '2025-08-10 19:48:40.788'),
('cme63jrh0008mukmo8gjuxfde', 'cme63jrgu0086ukmobzipvzdr', 'cme63jrg9007kukmow1k7dnk2', 'cme63jpac0002ukmonmpz2che', 0, '2025-08-10 19:48:40.788', 1, '2025-08-10 19:48:40.789'),
('cme63jrh2008qukmofg1dlult', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jpsv006sukmorpt3aim6', 'cme63jpac0001ukmof66twwc2', 0, NULL, 1, '2025-08-10 19:48:40.790'),
('cme63jrh2008sukmomsfoofcg', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jq1r006wukmo7rr1nmi7', 'cme63jpac0001ukmof66twwc2', 0, NULL, 1, '2025-08-10 19:48:40.791'),
('cme63jrh3008uukmo43dywp4t', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jqaj0070ukmowmdjlsxl', 'cme63jpac0001ukmof66twwc2', 0, NULL, 1, '2025-08-10 19:48:40.792'),
('cme63jrh4008wukmohl5gct0y', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jqir0074ukmoke8ownfr', 'cme63jpac0001ukmof66twwc2', 1, NULL, 1, '2025-08-10 19:48:40.792'),
('cme63jrh4008yukmopc0eq19w', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jqr00078ukmo0su3pk9p', 'cme63jpac0002ukmonmpz2che', 0, NULL, 1, '2025-08-10 19:48:40.793'),
('cme63jrh50090ukmodv45ty3e', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jqzi007cukmo2hdzxk7k', 'cme63jpac0002ukmonmpz2che', 0, NULL, 1, '2025-08-10 19:48:40.794'),
('cme63jrh60092ukmof61zk4lj', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jr7x007gukmomcn4sqql', 'cme63jpac0002ukmonmpz2che', 0, NULL, 1, '2025-08-10 19:48:40.794'),
('cme63jrh60094ukmousu8culm', 'cme63jrh1008oukmoa3b3lbqm', 'cme63jrg9007kukmow1k7dnk2', 'cme63jpac0002ukmonmpz2che', 1, NULL, 1, '2025-08-10 19:48:40.795');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` varchar(191) NOT NULL,
  `userId` varchar(191) NOT NULL,
  `roleId` varchar(191) NOT NULL,
  `assignedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `assignedBy` varchar(191) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `userId`, `roleId`, `assignedAt`, `assignedBy`) VALUES
('cme63jpt0006uukmottyfhgkc', 'cme63jpsv006sukmorpt3aim6', 'cme63jpbx0028ukmocdzy9eif', '2025-08-10 19:48:38.628', 'cme63jp9c0000ukmoylyi6jdy'),
('cme63jq26006yukmo61dsiyyp', 'cme63jq1r006wukmo7rr1nmi7', 'cme63jpbz002aukmo4kl82etd', '2025-08-10 19:48:38.958', 'cme63jp9c0000ukmoylyi6jdy'),
('cme63jqak0072ukmonv2lx72y', 'cme63jqaj0070ukmowmdjlsxl', 'cme63jpc0002cukmoxuhmjxli', '2025-08-10 19:48:39.261', 'cme63jp9c0000ukmoylyi6jdy'),
('cme63jqit0076ukmoplgha383', 'cme63jqir0074ukmoke8ownfr', 'cme63jpc1002eukmo8xpzrfzs', '2025-08-10 19:48:39.557', 'cme63jp9c0000ukmoylyi6jdy'),
('cme63jqrb007aukmokk7w5jdv', 'cme63jqr00078ukmo0su3pk9p', 'cme63jpc3002gukmob0xii7k7', '2025-08-10 19:48:39.863', 'cme63jp9c0000ukmoylyi6jdy'),
('cme63jqzk007eukmom5h5oqmu', 'cme63jqzi007cukmo2hdzxk7k', 'cme63jpc7002iukmouc7b00as', '2025-08-10 19:48:40.160', 'cme63jp9c0000ukmoylyi6jdy'),
('cme63jr80007iukmotcs3ziyi', 'cme63jr7x007gukmomcn4sqql', 'cme63jpc8002kukmon1modust', '2025-08-10 19:48:40.464', 'cme63jp9c0000ukmoylyi6jdy'),
('cme63jrgc007mukmo5jzzluld', 'cme63jrg9007kukmow1k7dnk2', 'cme63jpc9002mukmonixcj0id', '2025-08-10 19:48:40.764', 'cme63jp9c0000ukmoylyi6jdy');

-- --------------------------------------------------------

--
-- Table structure for table `_prisma_migrations`
--

CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) NOT NULL,
  `logs` text DEFAULT NULL,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `applied_steps_count` int(10) UNSIGNED NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_prisma_migrations`
--

INSERT INTO `_prisma_migrations` (`id`, `checksum`, `finished_at`, `migration_name`, `logs`, `rolled_back_at`, `started_at`, `applied_steps_count`) VALUES
('1ed7ee60-f458-479b-b832-f2cc7557275b', '6099465941da860cd54ac0bbcb0e3f0d185c79f4b08e20c1e4aff955efaeee8e', '2025-08-10 19:17:39.256', '20250808050919_add_refresh_tokens', NULL, NULL, '2025-08-10 19:17:38.997', 1),
('3186a6d3-8e0c-4471-8fde-f3fab44b1359', '722cacfb2eab531873efb26795cab3cd7ac54a8932dcc94603d68cd9d048dc0b', '2025-08-10 19:17:38.997', '20250807200433_init_schema_with_reports', NULL, NULL, '2025-08-10 19:17:38.857', 1),
('64f36e7b-eb4b-4cea-b672-7d4efd04624a', '8caf0146045208ed962926404fc9c3ea170ff5f52565d0b92e9d98b1df1bf665', '2025-08-10 19:29:46.253', '20250810192935_m1', NULL, NULL, '2025-08-10 19:29:45.560', 1),
('97a1d6e2-a439-401b-8d66-4cbe51c11e6d', 'c951b2aa151ff4c73e5a929a6749af37f4de838a7f958f7709ed5d22169776cc', '2025-08-10 19:17:38.856', '20250807194033_add_superadmin_avatar', NULL, NULL, '2025-08-10 19:17:38.513', 1),
('ac5fba2a-8057-4f9f-adc1-a09f8b9cb6c6', '50d8c14f5eca6a521866aeb325cb010bfb38bc7a59849f484072af035d6a615f', '2025-08-10 19:17:39.324', '20250810083510_add_type_to_password_reset_tokens', NULL, NULL, '2025-08-10 19:17:39.317', 1),
('ada25ef2-780e-4d20-bcfc-7009fe1fda46', '6c18658413936c2dba3f997baf338cd6cdcedaecde4d278273052f2b8cf00c76', '2025-08-10 19:17:39.317', '20250810081505_add_modules_table', NULL, NULL, '2025-08-10 19:17:39.257', 1);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `audit_logs_superAdminId_fkey` (`superAdminId`),
  ADD KEY `audit_logs_tenantId_fkey` (`tenantId`),
  ADD KEY `audit_logs_userId_fkey` (`userId`),
  ADD KEY `audit_logs_status_fkey` (`status`),
  ADD KEY `audit_logs_severity_fkey` (`severity`),
  ADD KEY `audit_logs_resourceType_fkey` (`resourceType`),
  ADD KEY `audit_logs_createdAt_fkey` (`createdAt`),
  ADD KEY `audit_logs_isArchived_fkey` (`isArchived`),
  ADD KEY `audit_logs_retentionExpiry_fkey` (`retentionExpiry`);

--
-- Indexes for table `invite_tokens`
--
ALTER TABLE `invite_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invite_tokens_token_key` (`token`),
  ADD KEY `invite_tokens_superAdminId_fkey` (`superAdminId`);

--
-- Indexes for table `modules`
--
ALTER TABLE `modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `modules_moduleKey_key` (`moduleKey`),
  ADD KEY `modules_parentModuleKey_fkey` (`parentModuleKey`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_createdBy_fkey` (`createdBy`),
  ADD KEY `notifications_targetTenantId_fkey` (`targetTenantId`),
  ADD KEY `notifications_status_idx` (`status`),
  ADD KEY `notifications_type_idx` (`type`),
  ADD KEY `notifications_priority_idx` (`priority`),
  ADD KEY `notifications_createdAt_idx` (`createdAt`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `password_reset_tokens_token_key` (`token`),
  ADD KEY `password_reset_tokens_email_idx` (`email`),
  ADD KEY `password_reset_tokens_superAdminId_fkey` (`superAdminId`);

--
-- Indexes for table `permissions`
--
ALTER TABLE `permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `permissions_name_key` (`name`),
  ADD UNIQUE KEY `permissions_moduleKey_action_resource_key` (`moduleKey`,`action`,`resource`),
  ADD KEY `permissions_action_idx` (`action`),
  ADD KEY `permissions_isActive_idx` (`isActive`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `refresh_tokens_tokenId_key` (`tokenId`),
  ADD UNIQUE KEY `refresh_tokens_hashedToken_key` (`hashedToken`),
  ADD KEY `refresh_tokens_superAdminId_fkey` (`superAdminId`),
  ADD KEY `refresh_tokens_tokenId_idx` (`tokenId`),
  ADD KEY `refresh_tokens_expiresAt_idx` (`expiresAt`);

--
-- Indexes for table `reports`
--
ALTER TABLE `reports`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reports_tenantId_fkey` (`tenantId`),
  ADD KEY `reports_superAdminId_fkey` (`superAdminId`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `roles_name_tenantId_key` (`name`,`tenantId`),
  ADD KEY `roles_tenantId_fkey` (`tenantId`),
  ADD KEY `roles_isActive_idx` (`isActive`),
  ADD KEY `roles_isTemplate_idx` (`isTemplate`);

--
-- Indexes for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_permissions_roleId_permissionId_key` (`roleId`,`permissionId`),
  ADD KEY `role_permissions_permissionId_fkey` (`permissionId`);

--
-- Indexes for table `super_admins`
--
ALTER TABLE `super_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `super_admins_email_key` (`email`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `support_tickets_tenantId_fkey` (`tenantId`),
  ADD KEY `support_tickets_userId_fkey` (`userId`),
  ADD KEY `support_tickets_status_fkey` (`status`),
  ADD KEY `support_tickets_priority_fkey` (`priority`),
  ADD KEY `support_tickets_category_fkey` (`category`);

--
-- Indexes for table `support_ticket_attachments`
--
ALTER TABLE `support_ticket_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `support_ticket_attachments_ticketId_fkey` (`ticketId`);

--
-- Indexes for table `support_ticket_comments`
--
ALTER TABLE `support_ticket_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `support_ticket_comments_ticketId_fkey` (`ticketId`),
  ADD KEY `support_ticket_comments_commentedBy_fkey` (`commentedBy`);

--
-- Indexes for table `support_ticket_comment_attachments`
--
ALTER TABLE `support_ticket_comment_attachments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `support_ticket_comment_attachments_commentId_fkey` (`commentId`);

--
-- Indexes for table `system_logs`
--
ALTER TABLE `system_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `system_settings`
--
ALTER TABLE `system_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `system_settings_key_key` (`key`);

--
-- Indexes for table `tenants`
--
ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tenants_slug_key` (`slug`);

--
-- Indexes for table `tenant_modules`
--
ALTER TABLE `tenant_modules`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `tenant_modules_tenantId_moduleKey_key` (`tenantId`,`moduleKey`),
  ADD KEY `tenant_modules_tenantId_fkey` (`tenantId`),
  ADD KEY `tenant_modules_moduleKey_fkey` (`moduleKey`),
  ADD KEY `tenant_modules_isEnabled_idx` (`isEnabled`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_tenantId_key` (`email`,`tenantId`),
  ADD KEY `users_tenantId_fkey` (`tenantId`);

--
-- Indexes for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_notifications_notificationId_userId_key` (`notificationId`,`userId`),
  ADD KEY `user_notifications_userId_fkey` (`userId`),
  ADD KEY `user_notifications_notificationId_fkey` (`notificationId`),
  ADD KEY `user_notifications_tenantId_fkey` (`tenantId`),
  ADD KEY `user_notifications_isRead_idx` (`isRead`),
  ADD KEY `user_notifications_createdAt_idx` (`createdAt`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_roles_userId_roleId_key` (`userId`,`roleId`),
  ADD KEY `user_roles_userId_fkey` (`userId`),
  ADD KEY `user_roles_roleId_fkey` (`roleId`);

--
-- Indexes for table `_prisma_migrations`
--
ALTER TABLE `_prisma_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD CONSTRAINT `audit_logs_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `audit_logs_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `invite_tokens`
--
ALTER TABLE `invite_tokens`
  ADD CONSTRAINT `invite_tokens_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `modules`
--
ALTER TABLE `modules`
  ADD CONSTRAINT `modules_parentModuleKey_fkey` FOREIGN KEY (`parentModuleKey`) REFERENCES `modules` (`moduleKey`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `notifications_targetTenantId_fkey` FOREIGN KEY (`targetTenantId`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD CONSTRAINT `password_reset_tokens_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `permissions`
--
ALTER TABLE `permissions`
  ADD CONSTRAINT `permissions_moduleKey_fkey` FOREIGN KEY (`moduleKey`) REFERENCES `modules` (`moduleKey`) ON UPDATE CASCADE;

--
-- Constraints for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD CONSTRAINT `refresh_tokens_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `reports`
--
ALTER TABLE `reports`
  ADD CONSTRAINT `reports_superAdminId_fkey` FOREIGN KEY (`superAdminId`) REFERENCES `super_admins` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `reports_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `roles`
--
ALTER TABLE `roles`
  ADD CONSTRAINT `roles_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `role_permissions`
--
ALTER TABLE `role_permissions`
  ADD CONSTRAINT `role_permissions_permissionId_fkey` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `role_permissions_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `support_tickets_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `support_ticket_attachments`
--
ALTER TABLE `support_ticket_attachments`
  ADD CONSTRAINT `support_ticket_attachments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `support_ticket_comments`
--
ALTER TABLE `support_ticket_comments`
  ADD CONSTRAINT `support_ticket_comments_ticketId_fkey` FOREIGN KEY (`ticketId`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `support_ticket_comment_attachments`
--
ALTER TABLE `support_ticket_comment_attachments`
  ADD CONSTRAINT `support_ticket_comment_attachments_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `support_ticket_comments` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `tenant_modules`
--
ALTER TABLE `tenant_modules`
  ADD CONSTRAINT `tenant_modules_moduleKey_fkey` FOREIGN KEY (`moduleKey`) REFERENCES `modules` (`moduleKey`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `tenant_modules_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `user_notifications`
--
ALTER TABLE `user_notifications`
  ADD CONSTRAINT `user_notifications_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_notifications_tenantId_fkey` FOREIGN KEY (`tenantId`) REFERENCES `tenants` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `user_notifications_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `user_roles_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
