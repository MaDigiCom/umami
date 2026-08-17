import {
  Button,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  ListItem,
  Loading,
  Select,
  Text,
} from '@umami/react-zen';
import {
  useLoginQuery,
  useMessages,
  useUpdateQuery,
  useUserTeamsQuery,
  useWebsite,
} from '@/components/hooks';
import { UserSelect } from '@/components/input/UserSelect';
import { ROLES } from '@/lib/constants';

const TARGET_TEAM = 'team';
const TARGET_USER = 'user';

export function WebsiteTransferForm({
  websiteId,
  onSave,
  onClose,
}: {
  websiteId: string;
  onSave?: () => void;
  onClose?: () => void;
}) {
  const { user } = useLoginQuery();
  const website = useWebsite();
  const { t, labels, messages, getErrorMessage } = useMessages();
  const { mutateAsync, error, isPending } = useUpdateQuery(`/websites/${websiteId}/transfer`);
  const { data: teams, isLoading } = useUserTeamsQuery(user.id);
  const isTeamWebsite = !!website?.teamId;
  const canTargetUser = user.isAdmin && !isTeamWebsite;

  const items =
    teams?.data?.filter(({ members }) =>
      members.some(
        ({ role, userId }) =>
          [ROLES.teamOwner, ROLES.teamManager].includes(role) && userId === user.id,
      ),
    ) || [];

  const handleSubmit = async (data: { teamId?: string; target?: string; targetUserId?: string }) => {
    const toUser = canTargetUser && data.target === TARGET_USER;

    await mutateAsync(
      {
        userId: website.teamId ? user.id : toUser ? data.targetUserId : undefined,
        teamId: !toUser && website.userId ? data.teamId : undefined,
      },
      {
        onSuccess: async () => {
          onSave?.();
          onClose?.();
        },
      },
    );
  };

  if (isLoading) {
    return <Loading icon="dots" placement="center" />;
  }

  return (
    <Form
      onSubmit={handleSubmit}
      error={getErrorMessage(error)}
      defaultValues={{ teamId: '', target: TARGET_TEAM, targetUserId: '' }}
    >
      {({ watch }) => {
        const selectedTeamId = watch('teamId');
        const selectedTargetUserId = watch('targetUserId');
        const showUserSelect = canTargetUser && watch('target') === TARGET_USER;

        return (
          <>
            <Text>
              {t(
                isTeamWebsite
                  ? messages.transferTeamWebsiteToUser
                  : messages.transferUserWebsiteToTeam,
              )}
            </Text>
            {canTargetUser && (
              <FormField name="target">
                <Select>
                  <ListItem id={TARGET_TEAM}>{t(labels.team)}</ListItem>
                  <ListItem id={TARGET_USER}>{t(labels.user)}</ListItem>
                </Select>
              </FormField>
            )}
            {!isTeamWebsite && !showUserSelect && (
              <FormField name="teamId">
                <Select>
                  {items.map(({ id, name }) => {
                    return (
                      <ListItem key={`${id}`} id={`${id}`}>
                        {name}
                      </ListItem>
                    );
                  })}
                </Select>
              </FormField>
            )}
            {showUserSelect && (
              <FormField name="targetUserId">
                <UserSelect />
              </FormField>
            )}
            <FormButtons>
              <Button onPress={onClose}>{t(labels.cancel)}</Button>
              <FormSubmitButton
                variant="primary"
                isLoading={isPending}
                isDisabled={
                  !isTeamWebsite &&
                  (showUserSelect ? !selectedTargetUserId : !selectedTeamId)
                }
              >
                {t(labels.transfer)}
              </FormSubmitButton>
            </FormButtons>
          </>
        );
      }}
    </Form>
  );
}
