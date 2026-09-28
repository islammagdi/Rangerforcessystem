import { createBrowserRouter } from "react-router";
import { LoginPage } from "./pages/LoginPage";
import { DashboardLayout } from "./pages/DashboardLayout";
import { DashboardHome } from "./pages/DashboardHome";
import { IndividualQueryPage } from "./pages/IndividualQueryPage";
import { SoldierDetailPage } from "./pages/SoldierDetailPage";
import { SoldierEditPage } from "./pages/SoldierEditPage";
import { AddNewSoldierPage } from "./pages/AddNewSoldierPage";
import { ReviewSoldierPage } from "./pages/ReviewSoldierPage";
import { SuccessSoldierPage } from "./pages/SuccessSoldierPage";
import { GroupReviewPage } from "./pages/GroupReviewPage";
import { GroupSuccessPage } from "./pages/GroupSuccessPage";
import { UnitsReportPage } from "./pages/UnitsReportPage";
import { UnitDetailPage } from "./pages/UnitDetailPage";
import { UnitSoldiersPage } from "./pages/UnitSoldiersPage";
import { IssueLetterPage } from "./pages/IssueLetterPage";
import { SelectSoldiersPage } from "./pages/SelectSoldiersPage";
import { LetterDataPage } from "./pages/LetterDataPage";
import { LetterReviewPage } from "./pages/LetterReviewPage";
import { LettersArchivePage } from "./pages/LettersArchivePage";
import { LetterDetailPage } from "./pages/LetterDetailPage";
import { DailyReportsPage } from "./pages/DailyReportsPage";
import { ReserveBatchesPage } from "./pages/ReserveBatchesPage";
import { ManageUnitsPage } from "./pages/ManageUnitsPage";
import { UnitTreePage } from "./pages/UnitTreePage";
import { ManageUsersPage } from "./pages/ManageUsersPage";
import ActivityLogPage from "./pages/ActivityLogPage";
import { DataBackupPage } from "./pages/DataBackupPage";
import { ManageBranchHeadsPage } from "./pages/ManageBranchHeadsPage";
import { ReserveBatchesOverviewPage } from "./pages/ReserveBatchesOverviewPage";
import { AllNotificationsPage } from "./pages/AllNotificationsPage";
import { UserGuidePage } from "./pages/UserGuidePage";
import { ArchiveOutgoingPage } from "./pages/ArchiveOutgoingPage";
import { ArchiveIncomingPage } from "./pages/ArchiveIncomingPage";
import { ArchiveOutgoingNewPage } from "./pages/ArchiveOutgoingNewPage";
import { ArchiveOutgoingDetailPage } from "./pages/ArchiveOutgoingDetailPage";
import { ArchiveIncomingNewPage } from "./pages/ArchiveIncomingNewPage";
import { ArchiveIncomingDetailPage } from "./pages/ArchiveIncomingDetailPage";
import { TrainingRecommendationsPage } from "./pages/TrainingRecommendationsPage";
import { TrainingRecommendationFormPage } from "./pages/TrainingRecommendationFormPage";
import { ManageUnifiedRegistryPage } from "./pages/ManageUnifiedRegistryPage";
import { ManageRolesPage } from "./pages/ManageRolesPage";
import { ManageEducationLevelsPage } from "./pages/ManageEducationLevelsPage";
import { ManageExternalAdministrationsPage } from "./pages/ManageExternalAdministrationsPage";
import { SheetsPage } from "./pages/SheetsPage";
import { SheetDetailPage } from "./pages/SheetDetailPage";
import { LetterTypesManagementPage  } from "./pages/LetterTypesManagementPage";
import { LetterTypeFormPage } from "./pages/LetterTypeFormPage";
import { SocialRecordPage } from "./pages/SocialRecordPage";
import { MartyrsRecordPage } from "./pages/MartyrsRecordPage";
import { MartyrDetailPage } from "./pages/MartyrDetailPage";
import { IncidentsRecordPage } from "./pages/IncidentsRecordPage";
import { JobsManagementPage } from "./pages/JobsManagementPage";
import { UnitsTreePage } from "./pages/UnitsTreePage"; // عدّل المسار حسب مكانك
import { PromotionNotificationsPage } from "./pages/promotion-notifications";
import { PromotionNotificationDetailPage } from "./pages/promotion-notification-detail";
import { SocialRecordUnitPage } from "./pages/SocialRecordUnitPage";
import { SocialRecordDetailPage } from "./pages/SocialRecordDetailPage";// ✅ جديد
export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/dashboard",
    Component: DashboardLayout,
    children: [
      { index: true, Component: DashboardHome },
      { path: "individual-query", Component: IndividualQueryPage },
      { path: "individual-query/soldier/:id", Component: SoldierDetailPage },
      { path: "individual-query/soldier/:id/edit", Component: SoldierEditPage },
      { path: "add-soldier", Component: AddNewSoldierPage },
      { path: "add-soldier/review", Component: ReviewSoldierPage },
      { path: "add-soldier/group-review", Component: GroupReviewPage },
      { path: "add-soldier/success", Component: SuccessSoldierPage },
      { path: "add-soldier/group-success", Component: GroupSuccessPage },
      { path: "units-report", Component: UnitsReportPage },
      { path: "units-report/:id", Component: UnitDetailPage },
      { path: "units-report/:id/soldiers", Component: UnitSoldiersPage },
      { path: "issue-letter", Component: IssueLetterPage },
      { path: "issue-letter/soldiers", Component: SelectSoldiersPage },
      { path: "issue-letter/letter-data", Component: LetterDataPage },
      { path: "issue-letter/review", Component: LetterReviewPage },
      { path: "letters-archive", Component: LettersArchivePage },
      { path: "letters-archive/:id", Component: LetterDetailPage },
      { path: "daily-reports", Component: DailyReportsPage },
      { path: "reserve-batches", Component: ReserveBatchesPage },
      { path: "manage-units", Component: ManageUnitsPage },
      { path: "manage-users", Component: ManageUsersPage },
      { path: "manage-units/:id/tree", Component: UnitTreePage },
      { path: "activity-log", Component: ActivityLogPage },
      { path: "data-backup", Component: DataBackupPage },
      { path: "manage-branch-heads", Component: ManageBranchHeadsPage },
      {
  path: "manage-reserve-batches",
  Component: ReserveBatchesOverviewPage,
},
{ path: "notifications", Component: AllNotificationsPage },
{ path: "user-guide", Component: UserGuidePage },
{ path: "archive/outgoing", Component: ArchiveOutgoingPage },
{ path: "archive/incoming", Component: ArchiveIncomingPage },
      { path: "archive/outgoing/new", Component: ArchiveOutgoingNewPage },
      { path: "archive/outgoing/:id", Component: ArchiveOutgoingDetailPage },
          { path: "archive/incoming/new", Component: ArchiveIncomingNewPage },
          { path: "archive/incoming/:id", Component: ArchiveIncomingDetailPage },
          { path: "training-recommendations", Component: TrainingRecommendationsPage },
            { path: "training-recommendations/new", Component: TrainingRecommendationFormPage },
              { path: "training-recommendations/:id", Component: TrainingRecommendationFormPage },
      { path: "manage-unified-registry", Component: ManageUnifiedRegistryPage,},
      { path: "manage-roles", Component: ManageRolesPage,},
          { path: "manage-external-administrations", Component: ManageExternalAdministrationsPage,},
       { path: "sheets", Component: SheetsPage },
       { path: "sheets/:id", Component: SheetDetailPage },
              { path: "manage-education-levels", Component: ManageEducationLevelsPage,},
              { path: "manage-letter-types", Component: LetterTypesManagementPage,},
              { path: "manage-letter-types/new", Component: LetterTypeFormPage },
{ path: "manage-letter-types/:id", Component: LetterTypeFormPage },
{ path: "social-record", Component: SocialRecordPage },
{ path: "martyrs-record", Component: MartyrsRecordPage },
{ path: "martyrs-record/:martyrId", Component: MartyrDetailPage },
{ path: "incidents-record", Component: IncidentsRecordPage },
{ path: "manage-jobs", Component: JobsManagementPage }, // ✅ جديد
{ path: "units-tree", Component: UnitsTreePage }, // ✅ جديد
{ path: "promotion-notifications", Component: PromotionNotificationsPage },
{ path: "promotion-notifications/:bulletinId", Component: PromotionNotificationDetailPage },
{ path: "social-record/unit/:unitId", Component: SocialRecordUnitPage },
{ path: "social-record/personnel/:personnelId", Component: SocialRecordDetailPage }, // ✅ جديد
    ],
  },
]);