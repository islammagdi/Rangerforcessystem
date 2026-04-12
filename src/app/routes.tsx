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
      { path: "individual-query",                    Component: IndividualQueryPage },
      { path: "individual-query/soldier/:id",         Component: SoldierDetailPage },
      { path: "individual-query/soldier/:id/edit",    Component: SoldierEditPage },
      { path: "add-soldier",                          Component: AddNewSoldierPage },
      { path: "add-soldier/review",                   Component: ReviewSoldierPage },
      { path: "add-soldier/group-review",             Component: GroupReviewPage },
      { path: "add-soldier/success",                  Component: SuccessSoldierPage },
      { path: "add-soldier/group-success",            Component: GroupSuccessPage },
      { path: "units-report",                         Component: UnitsReportPage },
      { path: "units-report/:id",                     Component: UnitDetailPage },
      { path: "units-report/:id/soldiers",            Component: UnitSoldiersPage },
      { path: "issue-letter",                         Component: IssueLetterPage },
      { path: "issue-letter/soldiers",                Component: SelectSoldiersPage },
    ],
  },
]);