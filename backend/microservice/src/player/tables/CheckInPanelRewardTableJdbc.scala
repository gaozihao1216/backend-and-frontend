package microservice.player.tables

import java.sql.Connection

private[tables] object CheckInPanelRewardTableJdbc {
  def initialize(connection: Connection): Unit =
    CheckInPanelRewardTableJdbcSchema.initialize(connection)

  def listByPanelId(connection: Connection, panelId: String): Vector[CheckInPanelRewardRow] =
    CheckInPanelRewardTableJdbcRead.listByPanelId(connection, panelId)

  def replacePanelRewards(connection: Connection, panelId: String, rows: Vector[CheckInPanelRewardRow]): Unit =
    CheckInPanelRewardTableJdbcWrite.replacePanelRewards(connection, panelId, rows)
}
